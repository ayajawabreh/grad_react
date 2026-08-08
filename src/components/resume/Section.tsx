import { C } from "../../constants/tokens";


export default function Section({
  title,
  children,
  last=false
}:{
  title:string;
  children:React.ReactNode;
  last?:boolean;
}){


return (

<div
style={{
marginBottom:last?0:30,
paddingBottom:last?0:25,
borderBottom:last?
"none":
`1px solid ${C.divider}`
}}
>


<h3
style={{
fontSize:12,
fontWeight:700,
color:C.accent,
textTransform:"uppercase",
marginBottom:14
}}
>
{title}
</h3>


{children}


</div>

)

}