export function resolveAvatarUrl(
  avatar?: string | null,
  fullName?: string
): string {

  if (avatar && avatar.trim() !== "") {

    if (
      avatar.startsWith("http://") ||
      avatar.startsWith("https://")
    ) {
      return avatar;
    }


    const apiBase =
      import.meta.env.VITE_API_URL
        ?.replace("/api", "")
        ||
      "http://127.0.0.1:8000";


    const cleanPath = avatar.startsWith("/")
      ? avatar.substring(1)
      : avatar;


    return `${apiBase}/storage/${cleanPath}`;
  }


  const name =
    encodeURIComponent(fullName || "User");


  return `https://ui-avatars.com/api/?name=${name}&background=6366F1&color=fff`;
}



export function formatDateRange(
  start?: string,
  end?: string
){

  if(!start && !end)
    return "";

  return `${start || ""} - ${end || "Present"}`;
}