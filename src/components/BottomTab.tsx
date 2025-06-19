import { Link, useLocation } from "react-router-dom";
import "./BottomTab.css";

const tabs = [
  { label: "홈", path: "/" },
  { label: "트랙", path: "/track" },
  { label: "전자사과", path: "/repeat" },
  { label: "설정", path: "/settings" },
];

function BottomTab() {
  const location = useLocation();

  return (
    <nav className="bottom-tab">
      {tabs.map((tab) => (
        <Link
          key={tab.path}
          to={tab.path}
          className={location.pathname === tab.path ? "active" : ""}
        >
          {tab.label}
        </Link>
      ))}
      <div className="logo">digital piano gallery</div>
    </nav>
  );
}

export default BottomTab;
