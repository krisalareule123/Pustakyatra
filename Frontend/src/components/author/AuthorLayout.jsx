import AuthorSidebar from "./AuthorSidebar";
import "./AuthorLayout.css";

export default function AuthorLayout({ children }) {
  return (
    <div className="author-layout">
      <AuthorSidebar />
      <main className="author-main-content">
        {children}
      </main>
    </div>
  );
}