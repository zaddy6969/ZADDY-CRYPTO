export async function getServerSideProps() {
  return {
    redirect: {
      destination: "/#unified-balance",
      permanent: false
    }
  };
}

export default function UnifiedBalanceRedirect() {
  return null;
}
