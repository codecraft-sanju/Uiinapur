import Link from 'next/link';
export default function NotFound() {
  return (
    <main className="empty-state">
      <h1>Beyond the map.</h1>
      <p>This corner of Uiinapur hasn’t been discovered yet.</p>
      <Link className="primary" href="/">
        Return to the nation
      </Link>
    </main>
  );
}
