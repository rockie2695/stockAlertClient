import React from "react";
import { render } from "@testing-library/react";
import App from "./App";

test("renders show first-in page description", () => {
  const { getByText } = render(<App />);
  const linkElement = getByText(/For HK Stock Price Showing And Notification/i);
  expect(linkElement).toBeInTheDocument();
});
