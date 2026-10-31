import "./notice.scss";
import { useCallback, useEffect, useRef, useState } from "react";

// const [notice, showNotice] = useNotice();
// showNotice("Saqlandi"), showNotice("Xatolik", "danger")
export const useNotice = (duration = 3000) => {
  const [notice, setNotice] = useState(null);

  const timer = useRef(null);

  const showNotice = useCallback(
    (text, type = "success") => {
      clearTimeout(timer.current);
      setNotice({ text, type });

      timer.current = setTimeout(() => setNotice(null), duration);
    },
    [duration]
  );

  useEffect(() => () => clearTimeout(timer.current), []);

  return [notice, showNotice];
};

export const Notice = ({ notice }) => {
  if (!notice) return null;

  return (
    <div className="notice" role="status">
      <div className={`alert alert-${notice.type} shadow m-0`}>{notice.text}</div>
    </div>
  );
};
