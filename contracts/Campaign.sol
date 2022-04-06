// SPDX-License-Identifier: MIT

pragma solidity ^0.8.12;

contract CampaignFactory {
    address[] public deployedCampaigns;

    function createCampaign(uint minimum) public {
        address newCampaign = address(new Campaign(minimum, msg.sender));
        deployedCampaigns.push(newCampaign);
    }

    function getDeployedCampaigns() public view returns (address[] memory) {
        return deployedCampaigns;
    }
}

contract Campaign {
    struct Request {
        string description;
        uint value;
        address payable recipient;
        bool complete;
        uint approvalCount;
        mapping(address => bool) approvals;
    }

    uint public requestCount;
    mapping(uint => Request) public requests;

    address public manager;
    uint public minimumContribution;
    mapping(address => bool) public approvers;
    uint public approversCount;

    modifier restricted() {
        require(msg.sender == manager, "You are not the manager of this campaign");
        _;
    }

    constructor(uint minimum, address creator) {
        manager = creator;
        minimumContribution = minimum;
    }

    function contribute() public payable {
        require(msg.value > minimumContribution, "You contributioin is lower than the minimum for this campaign");
        approvers[msg.sender] = true;
        approversCount++;
    }

    function createRequest(
        string memory description, 
        uint value, 
        address recipient) 
        public payable restricted 
    {
        Request storage newRequest = requests[requestCount++];
        newRequest.description = description;
        newRequest.value = value;
        newRequest.recipient = payable(recipient);
        newRequest.complete = false;
        newRequest.approvalCount = 0;
    }

    function approveRequest(uint index) public payable {
        Request storage request = requests[index];

        require(approvers[msg.sender], "You have not donated yet");
        require(!request.approvals[msg.sender], "You have already approved this request");

        request.approvals[msg.sender] = true;
        request.approvalCount++;
    }

    function finalizeRequest(uint index) public payable restricted {
        Request storage request = requests[index];
        require(request.approvalCount >= (approversCount / 2), "Not enough approvers for this request");
        require(!request.complete, "This request has been completed");

        request.recipient.transfer(request.value);
        request.complete = true;
    }
}