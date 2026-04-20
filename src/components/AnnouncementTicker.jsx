import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

export default function AnnouncementTicker() {
  const [items, setItems] = useState([]);
  const [paused, setPaused] = useState(false);
  const trackRef = useRef(null);

  useEffect(() => {
    fetch('/announcements.json')
      .then(r => r.json())
      .then(setItems)
      .catch(() => setItems([]));
  }, []);

  if (!items.length) return null;

  // Triple for seamless loop
  const loop = [...items, ...items, ...items];

  return (
    <div
      className="ticker"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-label="Announcements"
    >
      <div
        ref={trackRef}
        className="ticker-track"
        style={{ animationPlayState: paused ? 'paused' : 'running' }}
      >
        {loop.map((item, i) => (
          <TickerItem key={i} item={item} />
        ))}
      </div>
    </div>
  );
}

function TickerItem({ item }) {
  const content = (
    <>
      <span>{item.text}</span>
      <span className="ticker-dot" aria-hidden="true" />
    </>
  );
  if (!item.link) return <span className="ticker-item">{content}</span>;
  if (item.link.startsWith('http')) {
    return (
      <a className="ticker-item" href={item.link} target="_blank" rel="noopener noreferrer">
        {content}
      </a>
    );
  }
  return <Link className="ticker-item" to={item.link}>{content}</Link>;
}
