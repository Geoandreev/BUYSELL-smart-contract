// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "hardhat/console.sol";

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract myToken is ERC20 {
  constructor() ERC20("MyToken", "MT") {
      _mint(msg.sender, 1000);
  }
}

contract Vendor {

  myToken token;

  uint256 public price = 1;
  address private _admin;

  event Creation(address creator);
  event Bought(address buyer, uint256 amountOfETH, uint256 amountOfTokens);
  event Sold(address seller, uint256 amountOfTokens, uint256 amountOfETH);

  constructor() {
    _admin = msg.sender;
    token = new myToken();
  }

  function tokenAddress() public view returns (address){
    return address(token);
  }

  function admin() public view returns (address){
    return _admin;
  }

  function buyTokens() public payable returns (bool) {
    require(msg.value > 0, "ETH should be > 0");
    uint256 amountToBuy = msg.value;
    uint256 vendorBalance = token.balanceOf(address(this));
    require(vendorBalance >= amountToBuy, "Not enough tokens in reserves");
    token.transfer(msg.sender, amountToBuy);
    emit Bought(msg.sender, msg.value, amountToBuy);
    return true;
  }

  function sellTokens(uint256 amount) public {
    require(amount > 0, "Sell amount > 0");
    uint256 allowance = token.allowance(msg.sender, address(this));
    require(allowance >= amount, "No token allowance");
    token.transferFrom(msg.sender, address(this), amount);
    payable(msg.sender).transfer(amount);
    emit Sold(msg.sender, amount, amount);
  }
}