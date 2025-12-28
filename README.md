# Artifact Comparison and Evaluation Web Application with Human Study Support


## Motivation
Modern software engineering produces many different artifacts, such as source code, test cases, design diagrams, and documentation, created by both humans and automated tools such as artificial intelligence and large language models (LLMs). Evaluating the quality, correctness, understandability, and usability of these works is important but often subjective, and time-consuming. Researchers currently need an unified platform to design controlled, blinded studies and collect participant feedback.  
Our project will solve this problem by providing a web-based application where researchers can upload and organize artifacts, create evaluation tasks, and gather reliable participant responses through comparison features. This platform will make artifact evaluation more systematic, objective, efficient, and easy, especially when comparing human and AI-generated outputs.

---

## Goals
The goal of the project is to build a web application that enables researchers to upload, organize, and manage diverse software artifacts; design evaluation studies; and recruit participants who can compare and rate these artifacts under certain conditions. The system will also support participant assessment through quizzes and provide comprehensive dashboards to facilitate the use of the application for participants, researchers and reviewers.

---

## Problem Solved
Our application fills an important gap by offering a single, flexible environment for running human-subject studies on software artifacts. Instead of using many separate tools, it combines artifact management, participant recruitment, comparison and rating in one modular web platform. This makes the researcher’s job easier to plan and repeat, while keeping everything in an organized and efficient way.

---

## Features
- **User & Role Management:** The system provides a secure and structured role-based access control mechanism. Each user—whether an Admin, Researcher, Reviewer, or Participant—has access only to the features relevant to their role. Admins can manage all user accounts, assign or update roles, and monitor system activity to maintain overall stability. Researchers and Participants can create accounts, log in, reset passwords, and update their profiles as needed. This separation of permissions ensures that all operations are performed safely, efficiently, and according to the responsibilities of each role.
<br/><br/>
- **Artifact Management:** The platform allows researchers to upload, organize, and manage artifacts such as documents, diagrams, code samples, or other study materials. Artifacts can be classified with tags and metadata to make them easy to locate and group by category. Researchers can edit, delete, or replace artifacts when updates are needed. This structured management process ensures that only high-quality, relevant materials are used in studies, making it easier for both researchers and participants to work effectively.
  <br/><br/>
- **Participant Competency Assessment:** To ensure that studies involve suitable and qualified participants, the system includes tools for competency assessment. Participants may complete questionnaires or technical quizzes designed by researchers to evaluate their background knowledge and skills. Automated grading and performance summaries help researchers determine participant eligibility and readiness for specific studies. By matching participants to the right studies based on their results, this feature enhances the accuracy and reliability of the research data collected.
<br/><br/>
- **Artifact Comparison & Annotation:** Participants can review and compare multiple artifacts through a dedicated evaluation interface. The system supports side-by-side or multi-view comparison modes, allowing users to assess differences and similarities clearly. Participants can rate artifacts, leave comments, or suggest improvements directly through inline annotations. Researchers can define the evaluation criteria and later review or analyze participant feedback. This interactive feature fosters meaningful engagement and helps collect rich qualitative data that supports deeper insights into artifact quality and performance.
<br/><br/>
- **Study Management:** Researchers can design and manage complete studies from creation to completion. They can define study details such as the title, description, evaluation methods, and participant assignments. Studies can be opened, closed, or made visible to specific groups depending on progress and requirements. Researchers can monitor ongoing participant activity, analyze progress, and gather data throughout the study. When studies are completed, results can be securely exported for reporting or archival purposes. This feature provides an organized workflow that ensures research studies are conducted efficiently and systematically.
<br/><br/>
- **Dashboards:** The platform includes personalized dashboards for each user role. These dashboards centralize key information, making it easy for users to stay informed and make data-driven decisions.
  - **Admins** have dashboards that display system performance, user statistics, and overall platform health, helping them ensure stability and manage resources effectively.

  - **Researchers** have dashboards that present study summaries, participant progress, and evaluation outcomes, giving them a clear view of ongoing research.

  - **Participants** can view their personal dashboards to track assigned studies, completed tasks, and performance over time.
<br/><br/>
- **Deployment Options:** The system is designed for flexible deployment to accommodate different environments and needs. It can be set up locally using Docker for easy installation and testing, or deployed on a dedicated server for larger-scale or institutional use. This adaptability allows developers, universities, and research organizations to host the system according to their infrastructure and security requirements. The deployment approach supports both experimentation and real-world operation with minimal setup effort.
<br/><br/>
- **Future-Ready Architecture:** Built with a modular and object-oriented design, the system is highly extensible and easy to maintain. Each component can be updated or replaced without affecting the rest of the application. This makes it possible to introduce new artifact types, integrate third-party APIs, or add advanced analytical tools in the future. The architecture promotes scalability, ensuring that the platform can evolve alongside emerging research methods and technologies while maintaining performance and reliability.

---

## Extra Features
- ### Ranking System  
  A built-in ranking system adds a motivational layer for participants by evaluating their engagement and performance. Rankings can be determined based on factors such as quiz results, task completion, and the quality of artifact evaluations. This creates a sense of competition and encourages participants to contribute more actively and accurately. For researchers, rankings also help identify reliable and consistent contributors, which improves the overall quality of study data.
- ### Notification Center  
  The notification center serves as a unified communication hub within the system. Users receive real-time alerts about important updates such as study invitations, evaluation deadlines, new comments, or administrative actions. Notifications are tailored to each user’s role—participants may get reminders about tasks, researchers may receive alerts about new submissions or feedback, and admins may be notified of system events or flagged content. In addition to in-platform alerts, important notifications are also sent directly to the user’s registered email address, ensuring that critical updates are never missed even when the user is not logged into the system. This ensures smooth coordination, timely responses, and better awareness for all users across the platform.

---

## Selling Points
- **Blinded Evaluations** reduce bias and improve research validity.  
- **Flexible Architecture** easily accommodates new artifact types or metrics.  
- **Practical UI** makes the system easier to use.  
- **Comprehensive and User Friendly Dashboards** provide real-time insights and exportable reports.  
- **AI-Assisted Quiz Generation** facilitates participant evaluation ensuring that candidates have fundamental knowledge about the research field.  

---

## Why It’s Interesting
This platform makes research easier, faster, and more reliable. It not only facilitates the study process but also helps researchers quickly find and recruit the right participants from a large pool. By combining human evaluation with AI-assisted tools, it turns what is usually an unstructured and inconsistent process into a clear and repeatable workflow. Researchers can run controlled comparisons with minimal effort using features such as blinded study execution and participant skill checks through AI-generated quizzes. These tools cut down on manual work, reduce bias, and improve the quality and reproducibility of results. At the same time, participants enjoy a simple, user-friendly interface where they can complete comparison tasks and give structured feedback—leading to better data and a smoother overall experience.
