const CampaignFactory = artifacts.require("CampaignFactory");
const Campaign = artifacts.require("Campaign");

let campaignFactoryInstance;
let campaignInstance;

contract("Campaigns", async (accounts) => {
  beforeEach(async () => {
    campaignFactoryInstance = await CampaignFactory.deployed();
    await campaignFactoryInstance.createCampaign("100", {
      from: accounts[0],
      gas: "10000000",
    });
    [campaignAddress] = await campaignFactoryInstance.getDeployedCampaigns();
    campaignInstance = await Campaign.at(campaignAddress);
  });

  it("Should be deployed", async () => {
    assert.ok(campaignFactoryInstance.address);
    assert.ok(campaignInstance.address);
  });

  it("marks caller as the campaign manager", async () => {
    const manager = await campaignInstance.manager();
    assert.equal(accounts[0], manager);
  });

  it("allows people to contribute money and marks them as approvers", async () => {
    await campaignInstance.contribute({
      from: accounts[1],
      value: 200
    });
    const isContributor = await campaignInstance.approvers(accounts[1]);
    assert(isContributor);
  });

  it("requires a minimum contribution", async () => {
    try {
      await campaignInstance.contribute({
        value: 5,
        from: accounts[1]
      });
      assert(false);
    } catch (err) {
      assert(err);
    }
  });

  it('allows a manager to make a payment request', async () => {
    await campaignInstance
      .createRequest('Buy batteries', '100', accounts[1], {
        from: accounts[0],
        gas: '10000000'
      })
    const request = await campaignInstance.requests(0);
    assert.equal('Buy batteries', request.description);
  });

  it('processes requests', async () => {
    await campaignInstance.contribute({
      from: accounts[0],
      value: web3.utils.toWei('10', 'ether')
    });

    await campaignInstance
      .createRequest('A', web3.utils.toWei('5', 'ether'), accounts[1], {
        from: accounts[0],
        gas: '1000000'
      })

    await campaignInstance.approveRequest(0, {
      from: accounts[0],
      gas: '1000000'
    });

    await campaignInstance.finalizeRequest(0, {
      from: accounts[0],
      gas: '1000000'
    })

    let balance = await web3.eth.getBalance(accounts[1]);
    balance = web3.utils.fromWei(balance, 'ether');
    balance = parseFloat(balance);
    console.log(balance)
    assert(balance > 103)

  })
});
