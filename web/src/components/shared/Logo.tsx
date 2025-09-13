import linkSphere from "@/assets/web_images/linksphere_logo.svg";
import ls from "@/assets/web_images/ls_logo.svg";

function Logo({ width = "200px", isMainLogo = true }) {
  return (
    <>
    {
      isMainLogo
      ? <img 
        src={linkSphere} 
        alt="Ls"
        width={width}
        />
      : <img 
        src={ls}
        alt="Ls"
        width={"50px"}
        />
      
    }
    </>
  )
}

export default Logo;