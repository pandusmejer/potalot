export default function DashboardPage() {
  return (
    <main style={{ padding: 32, fontFamily: "sans-serif" }}>
      <h1>Potalot Dashboard</h1>
      <p>Hvis du kan se dette på Netlify, redigerer du det rigtige dashboard.</p>

      <section style={{ marginTop: 24 }}>
        <h2>Frøbank</h2>
        <ul>
          <li>Tigerella</li>
          <li>Purple Jalapeño</li>
          <li>Agurk Marketmore</li>
        </ul>
      </section>

      <section style={{ marginTop: 24 }}>
        <h2>Dyrkningsguides</h2>
        <p>Guides skal ligge centralt og kobles til frø.</p>
      </section>

      <section style={{ marginTop: 24 }}>
        <h2>To-do</h2>
        <ul>
          <li>Forspir tomater</li>
          <li>Ompot chili</li>
          <li>Tjek frø med udløb snart</li>
        </ul>
      </section>

      <section style={{ marginTop: 24 }}>
        <h2>Idébank</h2>
        <p>Mit Haveår, høstkurv, stemmestyring, community som valgfri feature.</p>
      </section>
    </main>
  );
}