const BASE = 'https://campus.tum.de/tumonline/';
// 5217 ниже — номер Studienplan Master Informatik, он зашит в URL.
// 1623 — внутренний id года в навигации сайта, не календарный год. Это 2026/27.
export const YEAR_ID = '1623';
export const YEAR_LABEL = '2026/27';

import * as cheerio from 'cheerio';

export async function getRootNodeId(fetchFn: typeof fetch, title: string) {
    /*
    Корневые папки (Master-Praktikum, Wahlmodulkatalog, …) уже есть в HTML showSpoTree.
    id строки выглядит как kn3601122: префикс kn нужен только DOM, в запросы уходит число.
    */

    const showSpoTreeUrl = BASE + 'wbstpcs.showSpoTree?pStStudiumNr=&pStpStpNr=5217&pSjNr=1623';
    
    const response = await fetchWithRetry(fetchFn, showSpoTreeUrl);
	const html = await response.text();

	const $ = cheerio.load(html);
    

	const row = $('tr')
		.filter((_, el) => $(el).text().includes(title))
		.first();
        
	const id = row.attr('id');

	if (!id) {
		return null;
	}

	return id.replace('kn', '');
}

export async function getChildren(fetchFn: typeof fetch, nodeId: string) {

    /*
    Один уровень дерева. Детей нет в первой странице: сайт догружает их callback-ом.
    NC_ — случайный суффикс пути, чтобы не получить закэшированный ответ.
    Ответ — XML, а строки таблицы лежат HTML-текстом внутри instruction. Парсим дважды.
    */
   
    const randomNc = Math.floor(Math.random() * 10000);
    const url =
        `${BASE}wbStpCs.cbSpoTree/NC_${randomNc}` +
        '?pStStudiumNr=' +
        '&pStpStpNr=5217' +
        '&pStPersonNr=' +
        '&pSJNr=1623' +
        '&pIsStudSicht=FALSE' +
        '&pShowErg=J' +
        '&pHideInactive=TRUE' +
        '&pCaller=' +
        `&pStpKnotenNr=${nodeId}` +
        `&pId=kn${nodeId}` +
        '&pAction=0' +
        '&pStpSTypNr=' +
        '&pStartSemester=';


    const response = await fetchWithRetry(fetchFn, url);
	const xml = await response.text();


	const $xml = cheerio.load(xml, {xml: true});

    const fragment = $xml(
        'instruction[type="ROWS"][action="insertAfterElement"]'
    ).text();

    const $ = cheerio.load(fragment);

    const children: { 
        nodeId: string; 
        title: string;
        ects: number | null;
        nodeType: number | null;
    }[] = [];



    // Найди все строки таблицы, у которых id начинается с букв "kn", расположенные внутри тела таблицы с id "tgt"
    $('#tgt > tbody > tr[id^="kn"]').each((_, el) => {
        const id = $(el).attr('id');

        if (!id) {
            return;
        }

        const childNodeId = id.replace('kn', '');

        const titleElement = $(el).find('.KnotenText').first();


        const title = titleElement
        .text()
        .replace(/\s+/g, ' ')
        .trim();

        const className = titleElement.attr('class') ?? '';

        // kt120 — курс, kt4 — модуль, kt11 — модуль в каталогах. Число берётся из CSS-класса.
        const typeMatch = className.match(/\bkt(\d+)\b/);

        const nodeType = typeMatch ? Number(typeMatch[1]) : null;

        const cells = $(el).find('td');

        // Колонки: название, значки, семестр, ECTS, вес.
        const ectsText = $(cells[3])
            .text()
            .replace(/\s+/g, ' ')
            .trim();
        
        const ects = ectsText && !Number.isNaN(Number(ectsText)) ? Number(ectsText) : null;
        
        

        children.push({
            nodeId: childNodeId,
            title,
            ects,
            nodeType
        });
    
    });

    return children;

}

export async function getNodeDetails(fetchFn: typeof fetch, nodeId: string) {
    /*
    Есть ли у узла запись на этот учебный год. Пустой результат сайт пишет
    «Keine Einträge vorhanden», даже если шапка таблицы на английском.
    Ссылка /course/<id> — это id описания, его потом спрашивает REST, это не id узла дерева.
    */
    const randomNc = Math.floor(Math.random() * 10000);


    const url =
        `${BASE}wbstpcs.cbshowghks_new/NC_${randomNc}` +
        '?psjnr=1623' +
        '&pStStudiumNr=' +
        '&pIsStudSicht=FALSE' +
        `&pid=GHKC_${nodeId}` +
        `&pStpKnotenNr=${nodeId}` +
        `&pRootKnotenNr=${nodeId}`;

    const response = await fetchWithRetry(fetchFn, url, {
        headers: {
            Accept: 'CALLBACK',
            'X-Requested-With': 'XMLHttpRequest',
            'X-Prototype-Version': '1.7.3',
            Referer:
                `${BASE}wbstpcs.showSpoTree` +
                '?pStStudiumNr=&pStpStpNr=5217&pSjNr=1623'
        }
    });


    const xml = await response.text();

    const $xml = cheerio.load(xml, { xml: true });

    const fragment = $xml(
        'instruction[action="updateElement"]'
    ).text();

    const $ = cheerio.load(fragment);

    const courseLink = $(`a[href*="pages/slc.tm.cp/course/"]`).first().attr('href');

    const courseUrl = courseLink ? new URL(courseLink, BASE).toString() : null;
    
    const text = $('body')
        .text()
        .replace(/\s+/g, ' ')
        .trim();

    const exists = !text.includes('Keine Einträge vorhanden');

    return {
        nodeId,
        exists,
        courseUrl
    };

}


type LocalizedText = {
    value?: string | null;
    translations?: {
        translation?: {
            lang: string;
            value?: string | null;
        }[];
    }
};

// В JSON бывает готовое value и массив translations. Предпочитаем en, иначе value как есть.
function getEnglishText(field?: LocalizedText | null): string | null {
    const english = field?.translations?.translation
        ?.find((translation) => translation.lang === 'en')
        ?.value;
    
    return english?.trim() || field?.value?.trim() || null;
}

export async function getCourseDescription(courseId: string, fetchFn: typeof fetch) {
    const url = `https://campus.tum.de/tumonline/ee/rest/slc.tm.cp/student/courses/${courseId}`;

    const response = await fetchWithRetry(fetchFn, url, {
        headers: {
            Accept: 'application/json'
        }
    });

    if(!response.ok) {
        throw new Error(`Failed to fetch course description: ${response.status}}`);
    }

    const data = await response.json();

    const courseDetails = data.resource?.[0]?.content?.cpCourseDetailDto;

    if(!courseDetails) {
        throw new Error(`Unexpected course response structure`);
    }

    const description = courseDetails.cpCourseDescriptionDto;

    return {
        content: getEnglishText(description?.courseContent),
        previousKnowledge: getEnglishText(description?.previousKnowledge),
        objective: getEnglishText(description?.courseObjective),
        teachingMethod: getEnglishText(description?.teachingMethod),
        registration: getEnglishText(description?.courseRegistrationInfo),
        note: getEnglishText(description?.additionalInformation?.comments)
    };

}


async function fetchWithRetry(
    fetchFn: typeof fetch,
    url: string,
    options?: RequestInit
): Promise<Response> {
    for (let attempt = 1; attempt <= 3; attempt++) {
        try {
            const response = await fetchFn(url, options);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            return response;
        } catch (error) {
            console.error(
                `Request failed (attempt ${attempt}/3):`,
                url,
                error
            );

            if (attempt === 3) {
                throw error;
            }

            await new Promise(resolve =>
                setTimeout(resolve, attempt * 1000)
            );
        }
    }

    throw new Error('Unexpected fetch failure');
}

