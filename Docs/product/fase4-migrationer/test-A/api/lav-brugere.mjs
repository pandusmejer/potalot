import bcrypt from 'bcryptjs'
import { randomBytes } from 'node:crypto'
import { writeFileSync } from 'node:fs'
const navne = ['owner', 'alice', 'bob', 'carol']
const ud = {}; const sql = []
for (const n of navne) {
  const pw = randomBytes(18).toString('base64url')
  const hash = bcrypt.hashSync(pw, 10)
  ud[n] = { email: `${n}@example.test`, password: pw }
  sql.push(`('${n}@example.test','${hash}')`)
}
writeFileSync('legitimation.json', JSON.stringify(ud), { mode: 0o600 })
// Kun hashes udskrives (ingen klartekst-adgangskoder)
console.log(sql.join(',\n'))
