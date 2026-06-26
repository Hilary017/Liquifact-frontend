import { render } from "@testing-library/react";
import { useWallet } from "./WalletContext";

function TestConsumer() {
  useWallet();
  return null;
}

describe("useWallet", () => {
  it("throws when used outside of a WalletProvider", () => {
    expect(() => render(<TestConsumer />)).toThrow(
      "useWallet must be used within a WalletProvider"
    );
  });
});
