export async function getServerSideProps() {
  return {
    redirect: {
      destination: "/#activity",
      permanent: false
    }
  };
}

export default function ActivityRedirect() {
  return null;
}
