import React from "react";
import Head from "next/head";
import Link from "next/link";

function Error({ statusCode }: { statusCode?: number }) {
  return (
    <>
      <Head>
        <title>{statusCode ? `${statusCode} Error` : "An error occurred"}</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
        <div className="max-w-lg w-full text-center">
          <h1 className="text-6xl font-bold text-primary-600 dark:text-primary-400 mb-4">
            {statusCode || "Error"}
          </h1>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
            {statusCode === 404
              ? "Page Not Found"
              : statusCode === 500
              ? "Internal Server Error"
              : "An unexpected error has occurred"}
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-8">
            {statusCode === 404
              ? "Sorry, the page you are looking for does not exist."
              : statusCode === 500
              ? "Sorry, something went wrong on our end."
              : "Sorry, an unexpected error has occurred. Please try again later."}
          </p>
          <Link href="/" className="inline-block px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors">
            Go to Homepage
          </Link>
        </div>
      </div>
    </>
  );
}

Error.getInitialProps = ({ res, err }: any) => {
  const statusCode = res?.statusCode || err?.statusCode || 404;
  return { statusCode };
};

export default Error;