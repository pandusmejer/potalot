// Offentlig preview af Havehistorie-stilprøven — så Anna kan se den uden login
// (samme mønster som calendar-inspiration-preview). Låst til mobil-bredde.
// SKAL gates/fjernes før produktion (jf. preview-gate-reglen). Den rigtige,
// gatede placering er /admin/qa/havehistorier.
import { HavehistorieKort } from '@/components/havebog/havehistorie-kort'
import { HavehistorieArtikel } from '@/components/havebog/havehistorie-artikel'
import { HAVEHISTORIER } from '@/data/havehistorier'

export const dynamic = 'force-dynamic'

export default function HavehistorierPreviewPage() {
  const h = HAVEHISTORIER[0]
  return (
    <div style={{ background: '#F4F0E5', minHeight: '100vh' }}>
      <div
        className="mx-auto"
        style={{ maxWidth: 390, containerType: 'inline-size', padding: '0 11px' }}
      >
        <div style={{ padding: '20px 0 48px' }}>
          {/* Sådan ser den ud i Havebogens venteværelse */}
          <HavehistorieKort historie={h} href="#artikel" />

          <div
            aria-hidden
            style={{ margin: '40px -11px', borderTop: '1px solid rgba(36,48,31,0.12)' }}
          />

          {/* Den fulde artikel */}
          <div id="artikel">
            <HavehistorieArtikel historie={h} returnTo="#" />
          </div>
        </div>
      </div>
    </div>
  )
}
