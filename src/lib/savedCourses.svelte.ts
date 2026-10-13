import { browser } from '$app/environment';
import type { SavedCourse } from './types/savedCourse';
export class SavedCoursesStore {
    courses = $state<SavedCourse[]>([]);

    initialized = $state(false);

    totalEcts = $derived(this.courses.reduce((sum, course) => sum + (course.ects ?? 0), 0));

    isSaved(courseId: number): boolean {
        for (const course of this.courses) {
            if (course.id === courseId) {
                return true;
            }
        }
        return false;
    }

    addCourse(course: SavedCourse): void {
        if (!this.isSaved(course.id)) {
            this.courses.push(course);
        }
        this.save();
        
    }

    removeCourse(courseId: number): void {    
        this.courses = this.courses.filter(item => item.id !== courseId);
        this.save();
    }

    private save() {
        // https://habr.com/ru/articles/647359/
        
        if (browser) {
            
            localStorage.setItem('savedCourses', JSON.stringify(this.courses));
            
        }

    }

    load() {
        if (!browser) {
            return;
        }
        try {
            const coursesLS = localStorage.getItem("savedCourses");
            if (coursesLS !== null) {
                const coursesTS = JSON.parse(coursesLS);
                
                if (Array.isArray(coursesTS)) {
                    this.courses = coursesTS;
                }
            }
        } catch (e) {
            console.error('Failed to load saved courses:', e);
            this.courses = [];
        } finally {
            this.initialized = true;
        }
    }
    
}