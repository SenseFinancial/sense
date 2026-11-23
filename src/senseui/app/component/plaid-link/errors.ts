const PlaidLinkErrors: Record<string, string> = {
    "ITEM_LOGIN_REQUIRED": "Your credentials or consent have expired with Plaid.",
    "PRODUCT_NOT_READY": "Plaid hasn't finished obtaining your financial data yet.",
    "PRODUCTS_NOT_SUPPORTED": "The product endpoint isn't compatible with your account.",
    "TRANSACTIONS_SYNC_MUTATION_DURING_PAGINATION": "Your account data has changed while we were retrieving your data.",
    "NO_ACCOUNTS": "Could not find any open accounts.",
    "ACCESS_NOT_GRANTED": "You didn't grant permission required for your request.",
    "INSTITUTION_NOT_RESPONDING": "There is a temporary problem with your financial institution not responding.",
    "INSTITUTION_DOWN": "There is a temporary problem connecting to your financial institution.",
    "RATE_LIMIT_EXCEEDED": "This application has made to many connections to Plaid.",
    "INTERNAL_SERVER_ERROR": "Unspecified error with the Plaid system."
};

export default PlaidLinkErrors;