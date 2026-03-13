export default function Home() {
  return (
    <main style={{padding:40,fontFamily:"sans-serif"}}>
      <h1>Potalot MVP</h1>

      <h2>Frøbank</h2>

      <button>Tilføj frø</button>

      <ul>
        <li>Tomat – San Marzano</li>
        <li>Chili – Jalapeño</li>
      </ul>

      <h2>Dyrkningsguides</h2>

      <button>Generer guide</button>

      <h2>Idebank</h2>

      <textarea placeholder="Ny idé..." />

      <h2>To-do</h2>

      <ul>
        <li>Så tomater</li>
        <li>Ompot chili</li>
      </ul>

    </main>
  )
}