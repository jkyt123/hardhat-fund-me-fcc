// ethers v6.13.1
// hardhat v2.22.5
const { assert, expect } = require("chai")
const { network, deployments, ethers, hre } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("FundMe", async function () {
          console.log("test fundme...")
          let fundMe
          let mockV3Aggregator
          let deployer
          let signer
          const sendValue = ethers.parseEther("1")
          beforeEach(async () => {
              // const accounts = await ethers.getStrings()
              // deployer = accounts[0]
              deployer = (await getNamedAccounts()).deployer
              signer = await ethers.getSigner(deployer)
              await deployments.fixture(["all"])
              // deploy
              //get Contract
              console.log("Dploy....")
              fundMe = await ethers.getContractAt(
                  "FundMe",
                  (
                      await deployments.get("FundMe")
                  ).address,
                  signer
              )
              console.log(fundMe)
              mockV3Aggregator = await ethers.getContractAt(
                  "MockV3Aggregator",
                  (
                      await deployments.get("MockV3Aggregator")
                  ).address,
                  signer
              )

              //console.log(mockV3Aggregator)
          })

          describe("constructor", function () {
              it("sets the aggregator address correctly", async () => {
                  console.log("test constructor...")
                  const response = await fundMe.getPriceFeed()
                  assert.equal(response, mockV3Aggregator.target)
              })
          })

          describe("fund", function () {
              // test send less wrong
              it("Fail if you don't send enough ETH", async () => {
                  console.log("test fund wrong...")
                  await expect(fundMe.fund()).to.be.revertedWith(
                      "Didn't send enough!"
                  )
              })
              // send enough

              it("Updates the amount funded data structure", async () => {
                  console.log("test fund right...")
                  await fundMe.fund({ value: sendValue })
                  const response = await fundMe.getAddressToAmountFunded(
                      deployer
                  )
                  assert.equal(response.toString(), sendValue.toString())
              })

              it("Adds funder to array of funders", async () => {
                  console.log("test funder.....")
                  await fundMe.fund({ value: sendValue })
                  const response = await fundMe.getFunder(0)
                  assert.equal(response, deployer)
              })
          })

          describe("withdraw", function () {
              beforeEach(async () => {
                  console.log("test withdraw.....")
                  await fundMe.fund({ value: sendValue })
              })
              it("withdraws ETH from a single funder", async () => {
                  // Arrange
                  const startingFundMeBalance =
                      await fundMe.runner.provider.getBalance(fundMe.target)
                  const startingDeployerBalance =
                      await fundMe.runner.provider.getBalance(deployer)
                  // Act
                  const transactionResponse = await fundMe.singleWithdraw()
                  const transactionReceipt = await transactionResponse.wait()
                  const { gasUsed, gasPrice } = transactionReceipt
                  const gasCost = gasUsed * gasPrice
                  console.log(`GasCost: ${gasCost}`)
                  console.log(`GasUsed: ${gasUsed}`)
                  console.log(`GasPrice: ${gasPrice}`)
                  const endingFundMeBalance =
                      await fundMe.runner.provider.getBalance(fundMe.target)
                  const endingDeployerBalance =
                      await fundMe.runner.provider.getBalance(deployer)

                  // Assert
                  // Maybe clean up to understand the testing
                  assert.equal(endingFundMeBalance, 0)
                  assert.equal(
                      startingFundMeBalance + startingDeployerBalance,
                      endingDeployerBalance + gasCost
                  )
              })

              // this test is overloaded. Ideally we'd split it into multiple tests
              // but for simplicity we left it as one
              it("is allows us to withdraw with multiple funders", async () => {
                  // Arrange
                  const accounts = await ethers.getSigners()
                  for (i = 1; i < 6; i++) {
                      const fundMeConnectedContract = await fundMe.connect(
                          accounts[i]
                      )
                      await fundMeConnectedContract.fund({ value: sendValue })
                  }
                  const startingFundMeBalance =
                      await fundMe.runner.provider.getBalance(fundMe.target)
                  const startingDeployerBalance =
                      await fundMe.runner.provider.getBalance(deployer)

                  // Act
                  const transactionResponse = await fundMe.multiWithdraw()
                  // Let's comapre gas costs :)
                  // const transactionResponse = await fundMe.singleWithdraw()
                  const transactionReceipt = await transactionResponse.wait()
                  const { gasUsed, gasPrice } = transactionReceipt
                  const withdrawGasCost = gasUsed * gasPrice
                  console.log(`GasCost: ${withdrawGasCost}`)
                  console.log(`GasUsed: ${gasUsed}`)
                  console.log(`GasPrice: ${gasPrice}`)
                  const endingFundMeBalance =
                      await fundMe.runner.provider.getBalance(fundMe.target)
                  const endingDeployerBalance =
                      await fundMe.runner.provider.getBalance(deployer)
                  // Assert
                  assert.equal(
                      startingFundMeBalance + startingDeployerBalance,
                      endingDeployerBalance + withdrawGasCost
                  )
                  // Make a getter for storage variables
                  await expect(fundMe.getFunder(0)).to.be.reverted

                  for (i = 1; i < 6; i++) {
                      assert.equal(
                          await fundMe.getAddressToAmountFunded(
                              accounts[i].address
                          ),
                          0
                      )
                  }
              })
              it("Only allows the owner to withdraw", async function () {
                  const accounts = await ethers.getSigners()
                  const fundMeConnectedContract = await fundMe.connect(
                      accounts[1]
                  )
                  await expect(
                      fundMeConnectedContract.singleWithdraw()
                  ).to.be.revertedWithCustomError(fundMe, "FundMe__NotOwner")
              })
          })
      })
