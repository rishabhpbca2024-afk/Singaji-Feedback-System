// src/data/mockData.js
// Centralized mock data for Admin Feedback, Faculty Dashboard/Schedule/Lectures, and Student Feedback

export const mockFaculties = [
  {
    id: "fac-1",
    name: "Dr. Rahul Sharma",
    department: "ITEG",
    designation: "Professor & HOD",
    email: "rahul.sharma@ssism.ac.in",
    phone: "+91 98765 43210",
    joiningDate: "2020-07-15",
    overallRating: 4.6,
    totalFeedbacks: 142,
    lecturesToday: [
      {
        lectureId: "LEC-101",
        number: "Lecture 1",
        time: "10:00 AM - 11:30 AM",
        subject: "Web Development",
        className: "BCA ITEG",
        group: "A",
        strength: 40,
        responses: 40,
        overallRating: 4.6,
        ratingStatus: "Excellent",
        parameters: [
          { name: "1. Clarity of Explanation", ratings: [0, 1, 2, 8, 29], avg: 4.6 },
          { name: "2. Subject Knowledge & Depth", ratings: [0, 0, 2, 7, 31], avg: 4.7 },
          { name: "3. Communication Skills", ratings: [0, 1, 3, 9, 27], avg: 4.5 },
          { name: "4. Punctuality & Time Management", ratings: [0, 0, 1, 6, 33], avg: 4.8 },
          { name: "5. Teaching Methodology", ratings: [0, 1, 2, 9, 28], avg: 4.6 },
          { name: "6. Student Engagement", ratings: [0, 2, 3, 8, 27], avg: 4.5 },
          { name: "7. Practical Examples", ratings: [0, 1, 1, 10, 28], avg: 4.6 },
          { name: "8. Doubt Resolution", ratings: [0, 0, 2, 8, 30], avg: 4.7 },
          { name: "9. Course Coverage", ratings: [0, 1, 2, 7, 30], avg: 4.6 },
          { name: "10. Overall Teaching Effectiveness", ratings: [0, 0, 2, 8, 30], avg: 4.7 }
        ],
        remarks: [
          "Sir explained the topic very clearly with live code.",
          "Good use of practical examples in React concepts.",
          "Lecture pace was perfect and easy to understand."
        ]
      },
      {
        lectureId: "LEC-102",
        number: "Lecture 2",
        time: "12:10 PM - 01:40 PM",
        subject: "Database Management System",
        className: "BCA ITEG",
        group: "B",
        strength: 38,
        responses: 38,
        overallRating: 4.7,
        ratingStatus: "Excellent",
        parameters: [
          { name: "1. Clarity of Explanation", ratings: [0, 0, 1, 9, 28], avg: 4.7 },
          { name: "2. Subject Knowledge & Depth", ratings: [0, 0, 1, 5, 32], avg: 4.8 },
          { name: "3. Communication Skills", ratings: [0, 1, 2, 8, 27], avg: 4.6 },
          { name: "4. Punctuality & Time Management", ratings: [0, 0, 2, 6, 30], avg: 4.7 },
          { name: "5. Teaching Methodology", ratings: [0, 0, 3, 7, 28], avg: 4.7 },
          { name: "6. Student Engagement", ratings: [0, 1, 2, 9, 26], avg: 4.6 },
          { name: "7. Practical Examples", ratings: [0, 0, 2, 8, 28], avg: 4.7 },
          { name: "8. Doubt Resolution", ratings: [0, 0, 1, 7, 30], avg: 4.8 },
          { name: "9. Course Coverage", ratings: [0, 1, 1, 8, 28], avg: 4.6 },
          { name: "10. Overall Teaching Effectiveness", ratings: [0, 0, 1, 7, 30], avg: 4.8 }
        ],
        remarks: [
          "SQL joins and indexing explained very smoothly.",
          "Doubt resolution was prompt and clear."
        ]
      },
      {
        lectureId: "LEC-103",
        number: "Lecture 3",
        time: "02:00 PM - 03:30 PM",
        subject: "Programming in C++",
        className: "BCA ITEG",
        group: "A",
        strength: 42,
        responses: 42,
        overallRating: 4.5,
        ratingStatus: "Excellent",
        parameters: [
          { name: "1. Clarity of Explanation", ratings: [0, 1, 3, 10, 28], avg: 4.5 },
          { name: "2. Subject Knowledge & Depth", ratings: [0, 0, 2, 8, 32], avg: 4.7 },
          { name: "3. Communication Skills", ratings: [0, 1, 4, 11, 26], avg: 4.5 },
          { name: "4. Punctuality & Time Management", ratings: [0, 0, 2, 7, 33], avg: 4.7 },
          { name: "5. Teaching Methodology", ratings: [0, 1, 3, 10, 28], avg: 4.5 },
          { name: "6. Student Engagement", ratings: [0, 2, 4, 10, 26], avg: 4.4 },
          { name: "7. Practical Examples", ratings: [0, 1, 2, 9, 30], avg: 4.6 },
          { name: "8. Doubt Resolution", ratings: [0, 0, 3, 9, 30], avg: 4.6 },
          { name: "9. Course Coverage", ratings: [0, 1, 3, 8, 30], avg: 4.6 },
          { name: "10. Overall Teaching Effectiveness", ratings: [0, 1, 2, 9, 30], avg: 4.6 }
        ],
        remarks: [
          "Pointers and dynamic memory allocation class was very practical."
        ]
      }
    ]
  },
  {
    id: "fac-2",
    name: "Prof. Neha Jain",
    department: "MEG",
    designation: "Assistant Professor",
    email: "neha.jain@ssism.ac.in",
    phone: "+91 98123 45678",
    joiningDate: "2021-08-10",
    overallRating: 3.2,
    totalFeedbacks: 95,
    lecturesToday: [
      {
        lectureId: "LEC-201",
        number: "Lecture 1",
        time: "10:00 AM - 11:30 AM",
        subject: "Thermodynamics",
        className: "Diploma MEG",
        group: "1A",
        strength: 35,
        responses: 35,
        overallRating: 3.1,
        ratingStatus: "Needs Improvement",
        parameters: [
          { name: "1. Clarity of Explanation", ratings: [4, 8, 12, 7, 4], avg: 3.0 },
          { name: "2. Subject Knowledge & Depth", ratings: [2, 5, 15, 9, 4], avg: 3.2 },
          { name: "3. Communication Skills", ratings: [3, 7, 14, 8, 3], avg: 3.0 },
          { name: "4. Punctuality & Time Management", ratings: [1, 4, 10, 12, 8], avg: 3.6 },
          { name: "5. Teaching Methodology", ratings: [4, 9, 11, 7, 4], avg: 2.9 },
          { name: "6. Student Engagement", ratings: [5, 8, 12, 6, 4], avg: 2.9 },
          { name: "7. Practical Examples", ratings: [4, 7, 13, 8, 3], avg: 3.0 },
          { name: "8. Doubt Resolution", ratings: [3, 6, 15, 7, 4], avg: 3.1 },
          { name: "9. Course Coverage", ratings: [2, 5, 14, 9, 5], avg: 3.3 },
          { name: "10. Overall Teaching Effectiveness", ratings: [4, 8, 12, 7, 4], avg: 3.0 }
        ],
        remarks: [
          "Lecture pace was too fast during numerical problems.",
          "Need more step-by-step practical examples on white board."
        ]
      },
      {
        lectureId: "LEC-202",
        number: "Lecture 2",
        time: "12:10 PM - 01:40 PM",
        subject: "Fluid Mechanics",
        className: "Diploma MEG",
        group: "1B",
        strength: 36,
        responses: 36,
        overallRating: 3.3,
        ratingStatus: "Needs Improvement",
        parameters: [
          { name: "1. Clarity of Explanation", ratings: [3, 6, 14, 9, 4], avg: 3.1 },
          { name: "2. Subject Knowledge & Depth", ratings: [1, 4, 16, 10, 5], avg: 3.4 },
          { name: "3. Communication Skills", ratings: [2, 5, 15, 10, 4], avg: 3.2 },
          { name: "4. Punctuality & Time Management", ratings: [0, 3, 12, 13, 8], avg: 3.7 },
          { name: "5. Teaching Methodology", ratings: [3, 7, 14, 8, 4], avg: 3.1 },
          { name: "6. Student Engagement", ratings: [4, 6, 15, 7, 4], avg: 3.0 },
          { name: "7. Practical Examples", ratings: [3, 5, 15, 9, 4], avg: 3.2 },
          { name: "8. Doubt Resolution", ratings: [2, 6, 14, 9, 5], avg: 3.3 },
          { name: "9. Course Coverage", ratings: [1, 4, 15, 11, 5], avg: 3.4 },
          { name: "10. Overall Teaching Effectiveness", ratings: [3, 6, 14, 9, 4], avg: 3.1 }
        ],
        remarks: [
          "Please resolve doubts towards the end of the class."
        ]
      }
    ]
  },
  {
    id: "fac-3",
    name: "Er. Amit Verma",
    department: "B.Tech",
    designation: "Associate Professor",
    email: "amit.verma@ssism.ac.in",
    phone: "+91 97654 32109",
    joiningDate: "2019-03-01",
    overallRating: 4.3,
    totalFeedbacks: 110,
    lecturesToday: [
      {
        lectureId: "LEC-301",
        number: "Lecture 1",
        time: "10:00 AM - 11:30 AM",
        subject: "Data Structures & Algorithms",
        className: "B.Tech CSE",
        group: "A",
        strength: 45,
        responses: 45,
        overallRating: 4.4,
        ratingStatus: "Good",
        parameters: [
          { name: "1. Clarity of Explanation", ratings: [0, 1, 4, 15, 25], avg: 4.4 },
          { name: "2. Subject Knowledge & Depth", ratings: [0, 0, 3, 12, 30], avg: 4.6 },
          { name: "3. Communication Skills", ratings: [0, 1, 5, 14, 25], avg: 4.4 },
          { name: "4. Punctuality & Time Management", ratings: [0, 0, 2, 10, 33], avg: 4.7 },
          { name: "5. Teaching Methodology", ratings: [0, 1, 4, 15, 25], avg: 4.4 },
          { name: "6. Student Engagement", ratings: [0, 2, 5, 14, 24], avg: 4.3 },
          { name: "7. Practical Examples", ratings: [0, 1, 3, 14, 27], avg: 4.5 },
          { name: "8. Doubt Resolution", ratings: [0, 1, 4, 12, 28], avg: 4.5 },
          { name: "9. Course Coverage", ratings: [0, 0, 4, 13, 28], avg: 4.5 },
          { name: "10. Overall Teaching Effectiveness", ratings: [0, 1, 4, 14, 26], avg: 4.4 }
        ],
        remarks: [
          "Binary Search Tree visualization was very helpful.",
          "Great lecture overall."
        ]
      },
      {
        lectureId: "LEC-302",
        number: "Lecture 2",
        time: "02:00 PM - 03:30 PM",
        subject: "Operating Systems",
        className: "B.Tech CSE",
        group: "B",
        strength: 44,
        responses: 44,
        overallRating: 4.2,
        ratingStatus: "Good",
        parameters: [
          { name: "1. Clarity of Explanation", ratings: [0, 2, 6, 16, 20], avg: 4.2 },
          { name: "2. Subject Knowledge & Depth", ratings: [0, 1, 4, 14, 25], avg: 4.4 },
          { name: "3. Communication Skills", ratings: [0, 2, 5, 17, 20], avg: 4.2 },
          { name: "4. Punctuality & Time Management", ratings: [0, 0, 3, 12, 29], avg: 4.6 },
          { name: "5. Teaching Methodology", ratings: [0, 2, 6, 16, 20], avg: 4.2 },
          { name: "6. Student Engagement", ratings: [0, 3, 6, 15, 20], avg: 4.1 },
          { name: "7. Practical Examples", ratings: [0, 2, 5, 15, 22], avg: 4.3 },
          { name: "8. Doubt Resolution", ratings: [0, 1, 5, 15, 23], avg: 4.4 },
          { name: "9. Course Coverage", ratings: [0, 1, 4, 15, 24], avg: 4.4 },
          { name: "10. Overall Teaching Effectiveness", ratings: [0, 2, 5, 16, 21], avg: 4.3 }
        ],
        remarks: [
          "Process scheduling algorithms explained well."
        ]
      }
    ]
  },
  {
    id: "fac-4",
    name: "Dr. Sunita Sharma",
    department: "BEG",
    designation: "Assistant Professor",
    email: "sunita.sharma@ssism.ac.in",
    phone: "+91 96543 21098",
    joiningDate: "2022-01-20",
    overallRating: 4.8,
    totalFeedbacks: 88,
    lecturesToday: [
      {
        lectureId: "LEC-401",
        number: "Lecture 1",
        time: "10:00 AM - 11:30 AM",
        subject: "Applied Mathematics",
        className: "BEG 1st Year",
        group: "A",
        strength: 50,
        responses: 50,
        overallRating: 4.8,
        ratingStatus: "Excellent",
        parameters: [
          { name: "1. Clarity of Explanation", ratings: [0, 0, 1, 6, 43], avg: 4.8 },
          { name: "2. Subject Knowledge & Depth", ratings: [0, 0, 0, 5, 45], avg: 4.9 },
          { name: "3. Communication Skills", ratings: [0, 0, 2, 7, 41], avg: 4.8 },
          { name: "4. Punctuality & Time Management", ratings: [0, 0, 1, 5, 44], avg: 4.9 },
          { name: "5. Teaching Methodology", ratings: [0, 0, 1, 7, 42], avg: 4.8 },
          { name: "6. Student Engagement", ratings: [0, 0, 2, 8, 40], avg: 4.8 },
          { name: "7. Practical Examples", ratings: [0, 0, 1, 7, 42], avg: 4.8 },
          { name: "8. Doubt Resolution", ratings: [0, 0, 0, 6, 44], avg: 4.9 },
          { name: "9. Course Coverage", ratings: [0, 0, 1, 7, 42], avg: 4.8 },
          { name: "10. Overall Teaching Effectiveness", ratings: [0, 0, 1, 6, 43], avg: 4.8 }
        ],
        remarks: [
          "Best maths teacher! Complex calculus problems made super simple."
        ]
      }
    ]
  }
];

export const defaultQuestions = [
  "1. Clarity of Explanation",
  "2. Subject Knowledge & Depth",
  "3. Communication Skills",
  "4. Punctuality & Time Management",
  "5. Teaching Methodology",
  "6. Student Engagement",
  "7. Practical Examples",
  "8. Doubt Resolution",
  "9. Course Coverage",
  "10. Overall Teaching Effectiveness"
];
