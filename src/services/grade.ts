/**
 * Represents a grade.
 */
export interface Grade {
  /**
   * The unique identifier of the grade.
   */
  id: string;
  /**
   * The student ID.
   */
  studentId: string;
  /**
   * The subject of the grade.
   */
  subject: string;
  /**
   * The grade value.
   */
  grade: number;
}

/**
 * Asynchronously retrieves a grade by its ID.
 *
 * @param id The ID of the grade to retrieve.
 * @returns A promise that resolves to a Grade object if found, or null if not found.
 */
export async function getGrade(id: string): Promise<Grade | null> {
  // TODO: Implement this by calling an API.

  return {
    id: '123',
    studentId: '456',
    subject: 'Math',
    grade: 90,
  };
}

/**
 * Asynchronously creates a new grade.
 *
 * @param grade The grade to create.
 * @returns A promise that resolves to the created Grade object.
 */
export async function createGrade(grade: Omit<Grade, 'id'>): Promise<Grade> {
  // TODO: Implement this by calling an API.

  return {
    id: '456',
    studentId: grade.studentId,
    subject: grade.subject,
    grade: grade.grade,
  };
}
