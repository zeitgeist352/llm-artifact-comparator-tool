import React from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation, useParams } from "react-router-dom";
import NotificationWidget from "./NotificationWidget";

// 🔹 Page Imports
import Login from "./Login";
import Signup from "./SignUp";
import ProfilePage from "./ProfilePage";
import ForgotPassword from "./ForgotPassword";
import ResetPassword from "./ResetPassword";
import ManageResearchersPage from "./ManageResearchersPage";
import ParticipantIndexPage from "./ParticipantIndexPage";
import ResearcherIndexPage from "./ResearcherIndexPage";
import AdminIndexPage from "./AdminIndex";
import CreateStudyPage from "./CreateStudyPage";
import ManageStudyPage from "./ManageStudyPage";
import MyInvitationsPage from "./MyInvitationsPage";
import MyStudiesPage from "./MyStudiesPage";
import QuizManagementPage from "./QuizManagementPage";
import CreateQuizPage from "./CreateQuizPage";
import QuizResultPage from "./QuizResultPage";
import EditQuizPage from "./EditQuizPage";
import TakeQuizPage from "./TakeQuizPage";
import ManageParticipantsPage from "./ManageParticipantsPage";
import EvaluationTasksPage from "./EvaluationTasksPage";
import ArtifactDetailPage from "./ArtifactDetailPage";
import ResearcherReviewDashboard from "./ResearcherReviewDashboard";
import ManageEvaluationCriteriaPage from "./ManageEvaluationCriteriaPage";
import MyArtifactsPage from "./MyArtifactsPage";
import UploadArtifactPage from "./UploadArtifactPage";
import ManageEvaluationTasksPage from "./ManageEvaluationTasksPage";
import AddTaskPage from "./AddTaskPage";
import TaskDetailsPage from "./TaskDetailsPage";
import ManageSingleTaskPage from "./ManageSingleTaskPage";
import ManageArtifactsForTaskPage from "./ManageArtifactsForTaskPage";
import JoinStudyPage from "./JoinStudyPage";
import TaskReportsPage from "./TaskReportsPage";
import TaskCommentsPage from "./TaskCommentsPage";
import ReviewerIndexPage from "./ReviewerIndexPage";
import ManageCorrectAnswerPage from "./ManageCorrectAnswerPage";
import PendingQuizReviewPage from "./PendingQuizReviewPage";
import DefineStudyTemplatePage from "./DefineStudyTemplatePage";
import QuizStatisticsPage from "./QuizStatisticsPage";
import BulkUploadPage from "./BulkUploadPage";
import MonitorStudyProgressPage from "./MonitorStudyProgressPage";
import MonitorEachTaskPage from "./MonitorEachTaskPage";
import InformationPage from "./InformationPage";



// 🔹 Inner Component to handle Location Logic
const MainLayout = () => {
    const location = useLocation();
    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user"));

    const TaskDetailsWrapper = () => {
        const { taskId } = useParams();
        return <TaskDetailsPage key={taskId} />;
    };

    const isAuthenticated = !!token && !!user;
    const role = user?.role;

    // Logic to hide notification specifically on the login page (or others if you add them to the array)
    const hideWidgetPaths = ["/"];
    const showWidget = !hideWidgetPaths.includes(location.pathname);

    return (
        <>
            {/* Show Widget everywhere except login page. 
                (Note: Widget handles its own visibility based on auth, 
                but this explicitly hides it on "/" as requested) 
            */}
            {showWidget && <NotificationWidget />}

            <Routes>
                {/* --- Public Routes --- */}
                <Route path="/" element={<Login />} />
                <Route path="/api/auth/register" element={<Signup />} />
                <Route path="/forgot" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/study/:studyId/tasks" element={<EvaluationTasksPage />} />
                <Route
                    path="/study/:studyId/tasks/:taskId"
                    element={<TaskDetailsWrapper />}
                />
                <Route path="/demo/evaluate-detail" element={<ArtifactDetailPage />} />
                <Route path="/demo/review-dashboard" element={<ResearcherReviewDashboard />} />
                <Route path="/task/:taskId/reports" element={<TaskReportsPage />} />
                <Route path="/task/:taskId/comments" element={<TaskCommentsPage />} />
                <Route path="/take-quiz/:studyId" element={<TakeQuizPage />} />
                <Route path="/manage-criteria/:studyId" element={<ManageEvaluationCriteriaPage />} /><Route path="/take-quiz/:studyId" element={<TakeQuizPage />} />
                <Route path="/join-study/:studyId" element={<JoinStudyPage />} />
                <Route path="/info" element={<InformationPage />} />


                <Route
                    path="/upload-artifact"
                    element={
                        isAuthenticated ? <UploadArtifactPage /> : <Navigate to="/" replace />
                    }
                />

                <Route
                    path="/profile"
                    element={
                        isAuthenticated ? <ProfilePage /> : <Navigate to="/" replace />
                    }
                />

                {/* --- Participant Routes --- */}
                <Route
                    path="/participant"
                    element={
                        isAuthenticated && role === "PARTICIPANT" ? (
                            <ParticipantIndexPage />
                        ) : (
                            <Navigate to="/" replace />
                        )
                    }
                />

                <Route
                    path="/take-quiz/:studyId"
                    element={
                        isAuthenticated && role === "PARTICIPANT" ? (
                            <TakeQuizPage />
                        ) : (
                            <Navigate to="/" replace />
                        )
                    }
                />

                {/* --- Reviewer Routes --- */}
                <Route
                    path="/reviewer"
                    element={
                        isAuthenticated && role === "REVIEWER" ? (
                            <ReviewerIndexPage />
                        ) : (
                            <Navigate to="/" replace />
                        )
                    }
                />
                <Route path="/my-invitations" element={<MyInvitationsPage />} />

                {/* --- Researcher Routes --- */}
                <Route
                    path="/researcher"
                    element={
                        isAuthenticated && role === "RESEARCHER" ? (
                            <ResearcherIndexPage />
                        ) : (
                            <Navigate to="/" replace />
                        )
                    }
                />

                <Route
                    path="/bulk-upload/:studyId"
                    element={
                        isAuthenticated && role === "RESEARCHER" ? (
                            <BulkUploadPage />   // 🔥 ARTIK DOĞRU SAYFA BU
                        ) : (
                            <Navigate to="/" replace />
                        )
                    }
                />


                <Route
                    path="/create-study"
                    element={
                        isAuthenticated && (role === "RESEARCHER") ? (
                            <CreateStudyPage />
                        ) : (
                            <Navigate to="/" replace />
                        )
                    }
                />
                <Route
                    path="/monitor-task/:taskId"
                    element={
                        isAuthenticated && (role === "RESEARCHER" || role === "REVIEWER")
                            ? <MonitorEachTaskPage />
                            : <Navigate to="/" replace />
                    }
                />


                <Route path="/manage-coresearchers/:studyId" element={<ManageResearchersPage />} />

                {/* ✅ MY STUDIES PAGE */}
                <Route
                    path="/my-studies"
                    element={
                        isAuthenticated && role === "RESEARCHER" ? (
                            <MyStudiesPage />
                        ) : (
                            <Navigate to="/" replace />
                        )
                    }
                />

                {/* ✅ MY ARTIFACTS PAGE */}
                <Route
                    path="/my-artifacts"
                    element={
                        isAuthenticated && role === "RESEARCHER" ? (
                            <MyArtifactsPage />
                        ) : (
                            <Navigate to="/" replace />
                        )
                    }
                />

                {/* ✅ MANAGE STUDY PAGE */}
                <Route
                    path="/manage-study/:studyId"
                    element={
                        isAuthenticated && role === "RESEARCHER" ? (
                            <ManageStudyPage />
                        ) : (
                            <Navigate to="/" replace />
                        )
                    }
                />

                {/* ✅ MANAGE PARTICIPANTS PAGE */}
                <Route
                    path="/manage-participants/:studyId"
                    element={
                        isAuthenticated && role === "RESEARCHER" ? (
                            <ManageParticipantsPage />
                        ) : (
                            <Navigate to="/" replace />
                        )
                    }
                />

                {/* ✅ QUIZ ROUTES */}
                <Route
                    path="/quiz-management/:studyId"
                    element={
                        isAuthenticated && role === "RESEARCHER" ? (
                            <QuizManagementPage />
                        ) : (
                            <Navigate to="/" replace />
                        )
                    }
                />
                <Route
                    path="/add-task/:studyId"
                    element={
                        isAuthenticated && role === "RESEARCHER" ? (
                            <AddTaskPage />
                        ) : (
                            <Navigate to="/" replace />
                        )
                    }
                />

                <Route
                    path="/quiz-statistics/:quizId"
                    element={
                        isAuthenticated && role === "RESEARCHER" ? (
                            <QuizStatisticsPage />
                        ) : (
                            <Navigate to="/" replace />
                        )
                    }
                />

                <Route
                    path="/create-quiz/:studyId"
                    element={
                        isAuthenticated && role === "RESEARCHER" ? (
                            <CreateQuizPage />
                        ) : (
                            <Navigate to="/" replace />
                        )
                    }
                />

                <Route
                    path="/edit-quiz/:studyId/:quizId"
                    element={
                        isAuthenticated && role === "RESEARCHER" ? (
                            <EditQuizPage />
                        ) : (
                            <Navigate to="/" replace />
                        )
                    }
                />

                <Route
                    path="/quiz-result/:resultId"
                    element={
                        isAuthenticated && role === "RESEARCHER" ? (
                            <QuizResultPage />
                        ) : (
                            <PendingQuizReviewPage />
                        )
                    }
                />

                {/* --- Admin Routes --- */}
                <Route
                    path="/admin"
                    element={
                        isAuthenticated && role === "ADMIN" ? (
                            <AdminIndexPage />
                        ) : (
                            <Navigate to="/" replace />
                        )
                    }
                />
                {/* ✅ MANAGE EVALUATION TASKS PAGE */}
                <Route
                    path="/manage-tasks/:studyId"
                    element={
                        isAuthenticated && role === "RESEARCHER" ? (
                            <ManageEvaluationTasksPage />
                        ) : (
                            <Navigate to="/" replace />
                        )
                    }
                />
                <Route
                    path="/manage-task/:taskId"
                    element={
                        isAuthenticated && role === "RESEARCHER" ? (
                            <ManageSingleTaskPage />
                        ) : (
                            <Navigate to="/" replace />
                        )
                    }
                />
                <Route
                    path="/manage-artifacts/:taskId"
                    element={
                        isAuthenticated && role === "RESEARCHER" ? (
                            <ManageArtifactsForTaskPage />
                        ) : (
                            <Navigate to="/" replace />
                        )
                    }
                />
                <Route
                    path="/manage-correct-answer/:taskId"
                    element={
                        isAuthenticated && role === "RESEARCHER" ? (
                            <ManageCorrectAnswerPage />
                        ) : (
                            <Navigate to="/" replace />
                        )
                    }
                />
                <Route
                    path="/study/:studyId/define-template"
                    element={
                        isAuthenticated && role === "RESEARCHER" ? (
                            <DefineStudyTemplatePage />
                        ) : (
                            <Navigate to="/" replace />
                        )
                    }
                />
                <Route
                    path="/create/custom-template"
                    element={
                        isAuthenticated && role === "RESEARCHER"
                            ? <DefineStudyTemplatePage />
                            : <Navigate to="/" replace />
                    }
                />
                <Route path="/monitor-study/:studyId" element={<MonitorStudyProgressPage />} />

            </Routes>
        </>
    );
};

// 🔹 Main App Component
function App() {
    return (
        <BrowserRouter>
            <MainLayout />
        </BrowserRouter>
    );
}

export default App;