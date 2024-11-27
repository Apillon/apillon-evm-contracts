// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts ^5.0.0
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20FlashMint.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract ApillonERC20Token is ERC20, ERC20Burnable, ERC20Pausable, ERC20Permit, ERC20FlashMint, AccessControl {
    bytes32 public constant CONTROLLER_ROLE = keccak256("CONTROLLER_ROLE");

    constructor(string memory name, string memory symbol, address adminAddress)
    ERC20(name, symbol)
    ERC20Permit(name)
    {
        address admin = adminAddress == address(0) ? msg.sender : adminAddress;
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(CONTROLLER_ROLE, msg.sender);
    }

    function pause() public onlyRole(CONTROLLER_ROLE) {
        _pause();
    }

    function unpause() public onlyRole(CONTROLLER_ROLE) {
        _unpause();
    }

    function mint(address to, uint256 amount) public onlyRole(CONTROLLER_ROLE) {
        _mint(to, amount);
    }

    // The following functions are overrides required by Solidity.
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    ) internal override(ERC20, ERC20Pausable) {
        super._beforeTokenTransfer(from, to, tokenId);
    }
}
