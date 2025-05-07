/**
 * Represents a student.
 */
export interface Student {
  /**
   * The unique identifier of the student.
   */
  id: string;
  /**
   * The name of the student.
   */
  name: string;
  /**
   * The class of the student.
   */
  class: string;
  /**
   * The school ID of the student.
   */
  schoolId: string;
}

/**
 * Asynchronously retrieves a student by its ID.
 *
 * @param id The ID of the student to retrieve.
 * @returns A promise that resolves to a Student object if found, or null if not found.
 */
export async function getStudent(id: string): Promise<Student | null> {
  // TODO: Implement this by calling an API.

  return {
    id: '123',
    name: 'John Doe',
    class: '10A',
    schoolId: '456',
  };
}

/**
 * Asynchronously creates a new student.
 *
 * @param student The student to create.
 * @returns A promise that resolves to the created Student object.
 */
export async function createStudent(student: Omit<Student, 'id'>): Promise<Student> {
  // TODO: Implement this by calling an API.

  return {
    id: '456',
    name: student.name,
    class: student.class,
    schoolId: student.schoolId,
  };
}
