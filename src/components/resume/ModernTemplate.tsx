import Section from "./Section";
import {TemplateProps} from "./types";
import {resolveAvatarUrl} from "./utils";


export default function ModernTemplate({
data
}:TemplateProps){


const avatar =
resolveAvatarUrl(
data.avatar,
data.full_name
);


return (

<div>

<img
src={avatar}
/>


<h1>
{data.full_name}
</h1>


<p>
{data.professional_title}
</p>


<Section title="Summary">

<p>
{data.summary}
</p>

</Section>



</div>

)

}