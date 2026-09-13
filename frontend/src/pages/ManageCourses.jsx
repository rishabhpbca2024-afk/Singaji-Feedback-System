import { useState } from "react";
import Modal from "../components/Modal.jsx";
import "./ManageCourses.css";

const API_URL = import.meta.env.VITE_API_URL;

function ManageCourses() {
  // const [courses, setCourses] = useState([
  //   {
  //     id: "1",
  //     name: "Data Structures & Algorithms",
  //     code: "CS-201",
  //     department: "ITEG",
  //     semester: "3rd Semester",
  //     faculty: "Prof. Rohan Verma",
  //     status: "Active",
  //   },
  //   {
  //     id: "2",
  //     name: "Database Management Systems",
  //     code: "CS-302",
  //     department: "ITEG",
  //     semester: "4th Semester",
  //     faculty: "Prof. Neha Jain",
  //     status: "Active",
  //   },
  //   {
  //     id: "3",
  //     name: "Fluid Mechanics & Thermodynamics",
  //     code: "ME-104",
  //     department: "MEG",
  //     semester: "2nd Semester",
  //     faculty: "Dr. Priya Verma",
  //     status: "Active",
  //   },
  //   {
  //     id: "4",
  //     name: "Technical Communication & Ethics",
  //     code: "HU-101",
  //     department: "BEG",
  //     semester: "1st Semester",
  //     faculty: "Prof. Pooja Sharma",
  //     status: "Active",
  //   },
  //   {
  //     id: "5",
  //     name: "Computer Networks & Cyber Security",
  //     code: "CS-401",
  //     department: "B.Tech",
  //     semester: "6th Semester",
  //     faculty: "Dr. S.K. Mehta",
  //     status: "Active",
  //   },
  // ]);

  // const departments = ["ITEG", "MEG", "BEG", "B.Tech"];

  // const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  // const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  // const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  // const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // const [newCourse, setNewCourse] = useState({
  //   name: "",
  //   code: "",
  //   department: "ITEG",
  //   semester: "1st Semester",
  //   faculty: "",
  //   status: "Active",
  // });

  // const [activeCourse, setActiveCourse] = useState(null);

  // // Add course
  // const handleAddCourse = (e) => {
  //   e.preventDefault();
  //   if (!newCourse.name || !newCourse.code || !newCourse.faculty) return;

  //   const created = {
  //     id: Date.now().toString(),
  //     ...newCourse,
  //   };
  //   setCourses([...courses, created]);
  //   setNewCourse({
  //     name: "",
  //     code: "",
  //     department: "ITEG",
  //     semester: "1st Semester",
  //     faculty: "",
  //     status: "Active",
  //   });
  //   setIsAddModalOpen(false);
  // };

  // // Edit course
  // const handleOpenEdit = (course) => {
  //   setActiveCourse({ ...course });
  //   setIsEditModalOpen(true);
  // };

  // const handleSaveEdit = (e) => {
  //   e.preventDefault();
  //   if (!activeCourse) return;

  //   setCourses(
  //     courses.map((c) => (c.id === activeCourse.id ? activeCourse : c))
  //   );
  //   setIsEditModalOpen(false);
  //   setActiveCourse(null);
  // };

  // // View course details
  // const handleOpenView = (course) => {
  //   setActiveCourse(course);
  //   setIsViewModalOpen(true);
  // };

  // // Delete course
  // const handleOpenDelete = (course) => {
  //   setActiveCourse(course);
  //   setIsDeleteModalOpen(true);
  // };

  // const handleConfirmDelete = () => {
  //   if (!activeCourse) return;
  //   setCourses(courses.filter((c) => c.id !== activeCourse.id));
  //   setIsDeleteModalOpen(false);
  //   setActiveCourse(null);
  // };

  // return (
  //   <div className="manage-courses-page">
  //     <div className="courses-header">
  //       <div>
  //         <h1>Manage Courses</h1>
  //         <p>View, add, edit, and configure department curriculum courses.</p>
  //       </div>

  //       <button className="add-btn" onClick={() => setIsAddModalOpen(true)}>
  //         + Add Course
  //       </button>
  //     </div>

  //     <div className="courses-grid">
  //       {courses.length > 0 ? (
  //         courses.map((course) => (
  //           <div key={course.id} className="course-card">
  //             <div className="course-card-top">
  //               <span className="course-code-badge">{course.code}</span>
  //               <span className="course-dept-badge">{course.department}</span>
  //             </div>

  //             <h2>{course.name}</h2>

  //             <div className="course-details">
  //               <p>
  //                 <strong>Semester:</strong> {course.semester}
  //               </p>
  //               <p>
  //                 <strong>Faculty:</strong> {course.faculty}
  //               </p>
  //               <p>
  //                 <strong>Status:</strong>{" "}
  //                 <span className="status-active">{course.status}</span>
  //               </p>
  //             </div>

  //             <div className="course-actions">
  //               <button
  //                 className="btn-view"
  //                 onClick={() => handleOpenView(course)}
  //               >
  //                 View
  //               </button>
  //               <button
  //                 className="btn-edit"
  //                 onClick={() => handleOpenEdit(course)}
  //               >
  //                 Edit
  //               </button>
  //               <button
  //                 className="btn-delete"
  //                 onClick={() => handleOpenDelete(course)}
  //               >
  //                 Delete
  //               </button>
  //             </div>
  //           </div>
  //         ))
  //       ) : (
  //         <div className="no-data-box">No courses available. Add a course to get started.</div>
  //       )}
  //     </div>

  //     {/* ADD COURSE MODAL */}
  //     <Modal
  //       isOpen={isAddModalOpen}
  //       onClose={() => setIsAddModalOpen(false)}
  //       title="Add New Course"
  //     >
  //       <form onSubmit={handleAddCourse} className="course-modal-form">
  //         <div className="modal-form-group">
  //           <label>Course Name</label>
  //           <input
  //             type="text"
  //             placeholder="e.g. Operating Systems"
  //             value={newCourse.name}
  //             onChange={(e) =>
  //               setNewCourse({ ...newCourse, name: e.target.value })
  //             }
  //             required
  //           />
  //         </div>

  //         <div className="modal-form-group">
  //           <label>Course Code</label>
  //           <input
  //             type="text"
  //             placeholder="e.g. CS-301"
  //             value={newCourse.code}
  //             onChange={(e) =>
  //               setNewCourse({ ...newCourse, code: e.target.value })
  //             }
  //             required
  //           />
  //         </div>

  //         <div className="modal-form-group">
  //           <label>Department</label>
  //           <select
  //             value={newCourse.department}
  //             onChange={(e) =>
  //               setNewCourse({ ...newCourse, department: e.target.value })
  //             }
  //           >
  //             {departments.map((d) => (
  //               <option key={d} value={d}>
  //                 {d}
  //               </option>
  //             ))}
  //           </select>
  //         </div>

  //         <div className="modal-form-group">
  //           <label>Semester</label>
  //           <input
  //             type="text"
  //             placeholder="e.g. 3rd Semester"
  //             value={newCourse.semester}
  //             onChange={(e) =>
  //               setNewCourse({ ...newCourse, semester: e.target.value })
  //             }
  //             required
  //           />
  //         </div>

  //         <div className="modal-form-group">
  //           <label>Assigned Faculty</label>
  //           <input
  //             type="text"
  //             placeholder="e.g. Dr. Rahul Sharma"
  //             value={newCourse.faculty}
  //             onChange={(e) =>
  //               setNewCourse({ ...newCourse, faculty: e.target.value })
  //             }
  //             required
  //           />
  //         </div>

  //         <div className="modal-actions">
  //           <button
  //             type="button"
  //             className="btn-secondary"
  //             onClick={() => setIsAddModalOpen(false)}
  //           >
  //             Cancel
  //           </button>
  //           <button type="submit" className="btn-primary">
  //             Add Course
  //           </button>
  //         </div>
  //       </form>
  //     </Modal>

  //     {/* EDIT COURSE MODAL */}
  //     <Modal
  //       isOpen={isEditModalOpen}
  //       onClose={() => setIsEditModalOpen(false)}
  //       title="Edit Course"
  //     >
  //       {activeCourse && (
  //         <form onSubmit={handleSaveEdit} className="course-modal-form">
  //           <div className="modal-form-group">
  //             <label>Course Name</label>
  //             <input
  //               type="text"
  //               value={activeCourse.name}
  //               onChange={(e) =>
  //                 setActiveCourse({ ...activeCourse, name: e.target.value })
  //               }
  //               required
  //             />
  //           </div>

  //           <div className="modal-form-group">
  //             <label>Course Code</label>
  //             <input
  //               type="text"
  //               value={activeCourse.code}
  //               onChange={(e) =>
  //                 setActiveCourse({ ...activeCourse, code: e.target.value })
  //               }
  //               required
  //             />
  //           </div>

  //           <div className="modal-form-group">
  //             <label>Department</label>
  //             <select
  //               value={activeCourse.department}
  //               onChange={(e) =>
  //                 setActiveCourse({ ...activeCourse, department: e.target.value })
  //               }
  //             >
  //               {departments.map((d) => (
  //                 <option key={d} value={d}>
  //                   {d}
  //                 </option>
  //               ))}
  //             </select>
  //           </div>

  //           <div className="modal-form-group">
  //             <label>Semester</label>
  //             <input
  //               type="text"
  //               value={activeCourse.semester}
  //               onChange={(e) =>
  //                 setActiveCourse({ ...activeCourse, semester: e.target.value })
  //               }
  //               required
  //             />
  //           </div>

  //           <div className="modal-form-group">
  //             <label>Assigned Faculty</label>
  //             <input
  //               type="text"
  //               value={activeCourse.faculty}
  //               onChange={(e) =>
  //                 setActiveCourse({ ...activeCourse, faculty: e.target.value })
  //               }
  //               required
  //             />
  //           </div>

  //           <div className="modal-actions">
  //             <button
  //               type="button"
  //               className="btn-secondary"
  //               onClick={() => setIsEditModalOpen(false)}
  //             >
  //               Cancel
  //             </button>
  //             <button type="submit" className="btn-primary">
  //               Save Changes
  //             </button>
  //           </div>
  //         </form>
  //       )}
  //     </Modal>

  //     {/* VIEW COURSE MODAL */}
  //     <Modal
  //       isOpen={isViewModalOpen}
  //       onClose={() => setIsViewModalOpen(false)}
  //       title="Course Information"
  //     >
  //       {activeCourse && (
  //         <div className="course-view-dialog">
  //           <h2>{activeCourse.name}</h2>
  //           <div className="view-detail-row">
  //             <strong>Course Code:</strong> {activeCourse.code}
  //           </div>
  //           <div className="view-detail-row">
  //             <strong>Department:</strong> {activeCourse.department}
  //           </div>
  //           <div className="view-detail-row">
  //             <strong>Semester:</strong> {activeCourse.semester}
  //           </div>
  //           <div className="view-detail-row">
  //             <strong>Assigned Faculty:</strong> {activeCourse.faculty}
  //           </div>
  //           <div className="view-detail-row">
  //             <strong>Status:</strong> {activeCourse.status}
  //           </div>
  //           <div className="modal-actions">
  //             <button
  //               className="btn-primary"
  //               onClick={() => setIsViewModalOpen(false)}
  //             >
  //               Close
  //             </button>
  //           </div>
  //         </div>
  //       )}
  //     </Modal>

  //     {/* DELETE CONFIRMATION MODAL */}
  //     <Modal
  //       isOpen={isDeleteModalOpen}
  //       onClose={() => setIsDeleteModalOpen(false)}
  //       title="Delete Course"
  //     >
  //       <div className="confirm-delete-body">
  //         <span className="confirm-icon"></span>
  //         <p>
  //           Are you sure you want to delete{" "}
  //           <strong>{activeCourse?.name}</strong>?
  //           <br />
  //           This action cannot be undone.
  //         </p>
  //       </div>
  //       <div className="modal-actions">
  //         <button
  //           type="button"
  //           className="btn-secondary"
  //           onClick={() => setIsDeleteModalOpen(false)}
  //         >
  //           Cancel
  //         </button>
  //         <button
  //           type="button"
  //           className="btn-danger"
  //           onClick={handleConfirmDelete}
  //         >
  //           Delete
  //         </button>
  //       </div>
  //     </Modal>

  //   </div>
  // );
}

export default ManageCourses;