import PlaidLinkComponent from "./plaid-link/page";

export default function Home() {
  return (
    <div className="container mx-auto p-4 w-2xl">
      <div className="flex">
        <div className="p-4 rounded shadow mb-4 mr-4 bg-blue-100 flex-2">
          <div className="text-3xl font-bold mb-2">
            What Is This?
          </div>
          <div className="mb-2">
            For Sense Financial to analyze your business finances, we need to look at your every day banking transactions.
          </div>
          <div className="mb-2">
            Clicking "Connect Bank" below will open a pop-up from our trusted data provider Plaid. In the pop-up, you will select the bank or credit union
            where you do most of your banking, then enter your credentials for them.
          </div>
          <div>When you're done the process, Plaid will share your bank transactions
            with us, and then we'll do some magic math and be able to show you some great graphs and charts about your money!
          </div>
        </div>
        <div className="mb-4 flex-1 flex flex-col">
          <div className="p-4 rounded shadow bg-green-100 mb-4">
            Sense Financial never sees or holds your banking credentials.
          </div>

          <div className="p-4 rounded shadow bg-green-100 flex-1">
            Plaid is a highly secure financial technology platform that passes encrypted financial data between us and your financial institutions.
          </div>
        </div>
      </div>
      <PlaidLinkComponent />
    </div>
  );
}
