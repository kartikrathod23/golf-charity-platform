import AdminDrawManager from "./AdminDrawManager";
import AdminReportsPanel from "./AdminReportsPanel";
import AdminWinnerReview from "./AdminWinnerReview";
import AdminCharityManager from "./AdminCharityManager";
import AdminPayoutCompletionPanel from "./AdminPayoutCompletionPanel";
import AdminScoreEditorPanel from "./AdminScoreEditorPanel";
import AdminUsersPanel from "./AdminUsersPanel";

export default function AdminPage() {
  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
      <p className="mt-2 text-zinc-600 dark:text-zinc-400">
        Manage draws, review winner proofs, and maintain the charity directory.
      </p>

      <div className="mt-6 space-y-4">
        <AdminDrawManager />
        <AdminWinnerReview />
        <AdminCharityManager />
        <AdminPayoutCompletionPanel />
        <AdminScoreEditorPanel />
        <AdminUsersPanel />
        <AdminReportsPanel />
      </div>
    </div>
  );
}

