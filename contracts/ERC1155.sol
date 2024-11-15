// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts ^5.0.0
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Pausable.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Burnable.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Supply.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract ApillonERC1155Token is ERC1155, ERC1155Pausable, ERC1155Burnable, ERC1155Supply, AccessControl {
    bytes32 public constant CONTROLLER_ROLE = keccak256("CONTROLLER_ROLE");

    constructor(string memory uri, address adminAddress) ERC1155(uri) {
        address admin = adminAddress == address(0) ? msg.sender : adminAddress;
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(CONTROLLER_ROLE, msg.sender);
    }

    function setURI(string memory newuri) public onlyRole(CONTROLLER_ROLE) {
        _setURI(newuri);
    }

    function pause() public onlyRole(CONTROLLER_ROLE) {
        _pause();
    }

    function unpause() public onlyRole(CONTROLLER_ROLE) {
        _unpause();
    }

    function mint(address account, uint256 id, uint256 amount, bytes memory data)
        public
        onlyRole(CONTROLLER_ROLE)
    {
        _mint(account, id, amount, data);
    }

    function mintBatch(address to, uint256[] memory ids, uint256[] memory amounts, bytes memory data)
        public
        onlyRole(CONTROLLER_ROLE)
    {
        _mintBatch(to, ids, amounts, data);
    }

    // The following functions are overrides required by Solidity.

    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC1155, AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    function _beforeTokenTransfer(
        address operator,
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) internal override(ERC1155, ERC1155Pausable, ERC1155Supply) {
        super._beforeTokenTransfer(operator, from, to, ids, amounts, data);
    }
//    function _update(address from, address to, uint256[] memory ids, uint256[] memory values)
//        internal
//        override(ERC1155, ERC1155Pausable, ERC1155Supply)
//    {
//        super._update(from, to, ids, values);
//    }
}
