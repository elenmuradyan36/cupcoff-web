import CupCoffApp from "@/components/CupCoffApp";

// One page hosts the whole app; screens are switched with # links (/#overview, /#counter, /#c-cards …).
export default function Home() {
  return (
    <>
      <noscript>
        <p style={{ padding: 24 }}>CupCoff needs JavaScript to run.</p>
      </noscript>
      <CupCoffApp />
    </>
  );
}
