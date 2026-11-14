export function OutpostVisual() {
  return (
    <div className="outpost-art" aria-label="Illustration of a lunar research outpost">
      <div className="art-stars" /><div className="planet-glow" />
      <svg className="outpost-svg" viewBox="0 0 680 360" role="img" aria-labelledby="outpost-title">
        <title id="outpost-title">Conceptual illustration of a lunar outpost at the south pole</title>
        <defs>
          <linearGradient id="ground" x1="0" x2=".85" y1="0" y2="1"><stop stopColor="#7e8ba8" /><stop offset="1" stopColor="#222c45" /></linearGradient>
          <linearGradient id="habitat" x1="0" x2="1" y1="0" y2="1"><stop stopColor="#e2e9f5" /><stop offset=".42" stopColor="#8291ad" /><stop offset="1" stopColor="#39465f" /></linearGradient>
          <linearGradient id="solar" x1="0" x2="1" y1="0" y2="1"><stop stopColor="#203e68" /><stop offset="1" stopColor="#101d39" /></linearGradient>
          <radialGradient id="moon" cx="50%" cy="45%"><stop stopColor="#fcf4df" /><stop offset=".72" stopColor="#bdc5d4" /><stop offset="1" stopColor="#727f99" /></radialGradient>
        </defs>
        <circle cx="505" cy="88" r="42" fill="url(#moon)" opacity=".88" /><circle cx="492" cy="76" r="5" fill="#919caf" opacity=".32" /><circle cx="521" cy="99" r="8" fill="#919caf" opacity=".3" />
        <path d="M0 273 Q74 229 157 260 T314 253 T476 259 T680 232 V360 H0Z" fill="url(#ground)" /><path d="M0 315 Q99 280 199 310 T404 298 T680 290 V360 H0Z" fill="#242e46" />
        <path d="M82 329h512" stroke="#a8b2c4" strokeOpacity=".22" strokeDasharray="3 8" />
        <g opacity=".6" fill="#101a30"><path d="m63 305 16-25 23 26z" /><path d="m570 295 21-31 28 33z" /><path d="m174 317 9-16 16 17z" /></g>
        <g>
          <path d="M278 204h127v72H278z" fill="url(#habitat)" stroke="#d3d9e5" strokeOpacity=".75" /><path d="m267 204 74-37 75 37z" fill="#abb6ca" stroke="#e2e7ef" strokeOpacity=".7" /><path d="m341 167 75 37h-29l-46-24z" fill="#63718c" />
          <path d="M291 215h28v20h-28z" fill="#bceaff" fillOpacity=".74" /><path d="M326 215h23v20h-23z" fill="#bceaff" fillOpacity=".64" /><path d="M357 214h35v62h-35z" fill="#64728c" /><path d="M365 223h20v19h-20z" fill="#253854" />
          <path d="M299 276v31m83-31v31" stroke="#8b99b0" strokeWidth="5" /><path d="M259 307h144" stroke="#c2cbd9" strokeOpacity=".7" strokeWidth="2" /><path d="m275 207 66-33 67 33" fill="none" stroke="#eff3fa" strokeOpacity=".6" />
          <path d="M268 210h-53m190 0h57" stroke="#9eabc0" strokeWidth="2" /><path d="M214 206h-23v44h23m248-44h22v44h-22" fill="none" stroke="#7e8ca6" strokeWidth="3" />
          <path d="M192 211h-49v6h49zm0 13h-49v6h49zm0 13h-49v6h49zm0 13h-49v6h49z" fill="url(#solar)" stroke="#85a5d4" strokeOpacity=".65" /><path d="M469 211h49v6h-49zm0 13h49v6h-49zm0 13h49v6h-49zm0 13h49v6h-49z" fill="url(#solar)" stroke="#85a5d4" strokeOpacity=".65" />
          <path d="M155 210v48m13-48v48m13-48v48m300-48v48m13-48v48m13-48v48" stroke="#7090be" strokeOpacity=".55" /><path d="M341 165v-21" stroke="#b5c0d3" strokeWidth="2" /><circle cx="341" cy="141" r="4" fill="#83e4ff" />
          <path d="M427 270v37m-10 0h21" stroke="#77869f" strokeWidth="3" /><circle cx="438" cy="304" r="3" fill="#f5c96d" />
        </g>
        <path d="M96 286h14m-7-7v14M543 278h14m-7-7v14" stroke="#d4dbea" strokeOpacity=".35" />
      </svg>
      <div className="art-coordinate"><span>◉</span> 89° 59′ S&nbsp; / &nbsp;31° 44′ E</div><div className="art-scanline" />
    </div>
  );
}
