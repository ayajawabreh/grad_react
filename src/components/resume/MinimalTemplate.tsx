import Section from "./Section";
import {TemplateProps} from "./types";


export default function MinimalTemplate({
data
}:TemplateProps){


return (

<div
style={{
padding:50,
background:"#fff"
}}
>


<h1>
{data.full_name}
</h1>


<p>
{data.email}
</p>



<Section title="Summary">

<p>
{data.summary}
</p>

</Section>



<Section title="Skills">

<p>
{
data.skills
?.map(s=>s.name)
.join(" | ")
}
</p>


</Section>



</div>

)

}