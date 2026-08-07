import Section from "./Section";
import {TemplateProps} from "./types";


export default function ProfessionalTemplate({
data
}:TemplateProps){


return (

<div
style={{
background:"#fff",
padding:40
}}
>


<h1>
{data.full_name}
</h1>


<p>
{data.professional_title}
</p>



<Section title="Experience">

{
data.experience?.map((item,index)=>(

<div key={index}>

<strong>
{item.title}
</strong>


<p>
{item.company}
</p>


<p>
{item.description}
</p>


</div>

))
}


</Section>


<Section title="Skills">

<p>
{
data.skills
?.map(s=>s.name)
.join(", ")
}
</p>


</Section>


</div>

)

}