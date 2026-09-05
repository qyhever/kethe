import { Navbar } from '../components/Navbar'
import { Tabbar } from '../components/Tarbar'

export function HomePage() {
  return (
    <div>
      <Navbar />
      {Array.from({ length: 100 }, (_, i) => (
        <div key={i}>{i + 1}</div>
      ))}
      <Tabbar />
    </div>
  )
}
