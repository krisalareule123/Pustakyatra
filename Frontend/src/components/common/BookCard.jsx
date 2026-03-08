import "./BookCard.css";

export default function BookCard({ book }) {
  const initials = book.title
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");

  return (
    <div className="bookcard">
      <div className="bookcover">
        <div className="bookbadge">{initials}</div>

        <div className="booklines">
          <span />
          <span />
          <span />
        </div>
      </div>

      <h4 className="booktitle">{book.title}</h4>
    </div>
  );
}
