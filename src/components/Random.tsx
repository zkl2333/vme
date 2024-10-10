'use client'

import { MouseEvent as ReactMouseEvent } from 'react'

const handleScroll = (
  e: ReactMouseEvent<HTMLButtonElement, MouseEvent>,
  targetId: string,
) => {
  e.preventDefault()
  const targetElement = document.getElementById(targetId)
  if (targetElement) {
    targetElement.scrollIntoView({
      behavior: 'smooth', // 平滑滚动
    })

    if (history.pushState) {
      history.pushState(null, '', `#${targetId}`)
    }
  }
}

const Random = ({ ids }: { ids: string[] }) => {
  return (
    <div className="fixed bottom-4 right-4">
      <button
        className="flex h-12 w-12 items-center justify-center rounded-full bg-white transition-transform hover:scale-105 dark:bg-gray-950"
        onClick={(e) => {
          const randomId = ids[Math.floor(Math.random() * ids.length)]
          handleScroll(e, randomId)
        }}
      >
        <svg
          className="icon"
          viewBox="0 0 1024 1024"
          version="1.1"
          xmlns="http://www.w3.org/2000/svg"
          p-id="5075"
          width="200"
          height="200"
          fill="currentColor"
        >
          <path
            d="M512 50.033778C257.265778 50.033778 50.033778 257.265778 50.033778 512c0 254.72 207.232 461.966222 461.966222 461.966222S973.966222 766.72 973.966222 512C973.966222 257.265778 766.734222 50.033778 512 50.033778z m0 867.043555C288.64 917.077333 106.922667 735.36 106.922667 512S288.64 106.922667 512 106.922667 917.077333 288.64 917.077333 512 735.36 917.077333 512 917.077333z"
            fill=""
            p-id="5076"
          ></path>
          <path
            d="M606.520889 166.954667a14.222222 14.222222 0 1 0-7.509333 27.448889C741.617778 233.386667 841.216 363.989333 841.216 512a14.222222 14.222222 0 1 0 28.444444 0c0-160.796444-108.202667-302.677333-263.139555-345.045333zM512 182.769778a343.822222 343.822222 0 0 1 19.2 0.526222 14.222222 14.222222 0 0 0 0.753778-28.416 371.171556 371.171556 0 0 0-19.939556-0.554667 14.222222 14.222222 0 1 0-0.014222 28.444445z"
            fill=""
            p-id="5077"
          ></path>
          <path
            d="M596.579556 439.623111l0.668444 51.328c0.256 17.052444 13.838222 29.909333 31.672889 29.909333 6.556444 0 13.084444-1.792 19.057778-5.333333l106.552889-65.891555c9.841778-5.859556 15.445333-14.805333 15.303111-24.576-0.128-10.396444-6.599111-19.939556-17.393778-25.984l-106.197333-63.459556c-13.639111-7.608889-32.142222-5.390222-42.311112 4.949333a29.127111 29.127111 0 0 0-8.362666 21.105778l0.64 49.521778c-27.960889 1.038222-87.523556 13.169778-137.187556 90.154667-21.859556-56.32-53.930667-94.222222-95.672889-112.497778-62.478222-27.320889-122.453333-0.099556-124.984889 1.066666a14.222222 14.222222 0 1 0 12.003556 25.799112c0.512-0.256 50.730667-23.054222 101.589333-0.810667 38.784 16.967111 68.138667 55.779556 87.267556 115.328 0.426667 1.336889 0.938667 2.488889 1.379555 3.811555l-0.625777 1.223112c-75.733333 155.534222-186.040889 117.688889-190.620445 115.996444a14.293333 14.293333 0 0 0-18.304 8.362667c-2.730667 7.367111 0.995556 15.559111 8.362667 18.304 0.483556 0.170667 18.019556 6.385778 44.387555 6.385777 45.041778 0 115.811556-18.232889 170.993778-116.067555 40.163556 78.094222 105.6 88.675556 138.140445 88.675555 1.194667 0 2.133333-0.056889 3.242666-0.085333l-0.625777 48.867556c-0.128 8.021333 2.844444 15.544889 8.362666 21.134222 6.058667 6.144 14.833778 9.671111 24.135111 9.671111a37.831111 37.831111 0 0 0 18.517334-4.920889l105.500444-63.061333c11.121778-6.243556 17.592889-15.772444 17.720889-26.197334 0.128-9.756444-5.461333-18.716444-15.104-24.448l-106.979556-66.133333a36.864 36.864 0 0 0-18.816-5.219555c-17.834667 0-31.416889 12.856889-31.672888 29.937777l-0.682667 52.309334c-25.329778 1.422222-90.282667-4.352-124.913778-92.416 45.169778-83.783111 101.489778-95.772444 124.956445-96.739556z m31.502222-80.270222c1.052444 0 2.673778 0.199111 3.911111 0.881778l106.168889 63.445333c0.867556 0.483556 1.521778 0.952889 2.048 1.351111l-0.426667 0.284445-106.581333 65.891555c-5.248 3.143111-7.466667 1.194667-7.495111-0.625778l-1.479111-130.062222c0.554667-0.568889 1.962667-1.166222 3.854222-1.166222z m-2.389334 217.514667c0.014222-1.223111 1.109333-1.863111 3.228445-1.863112 0.995556 0 2.588444 0.227556 4.081778 1.137778l106.965333 66.119111 0.241778 0.142223c-0.568889 0.440889-1.336889 0.952889-2.360889 1.536l-105.472 63.047111c-4.536889 2.488889-7.210667 1.265778-8.348445-0.881778l1.664-129.237333z"
            fill=""
            p-id="5078"
          ></path>
        </svg>
      </button>
    </div>
  )
}

export default Random
