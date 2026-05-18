export async function getServerSideProps() {
  return {
    redirect: {
      destination: "/#assistant",
      permanent: false
    }
  };
}

export default function AssistantRedirect() {
  return null;
}
