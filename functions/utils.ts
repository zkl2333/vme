export async function getKFC() {
  const res = await fetch('https://kfc-crazy-thursday.vercel.app/api/index')
  const data = await res.text()
  return data 
}