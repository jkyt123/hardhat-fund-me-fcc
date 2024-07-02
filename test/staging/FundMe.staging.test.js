const { assert } = require("chai")
const { network, ethers, getNamedAccounts, deployments } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")

developmentChains.includes(network.name)
    ? describe.skip
    : describe("FundMe Staging Tests", function () {
          let deployer
          let fundMe
          const sendValue = ethers.parseEther("0.1")
          //console.log(hre.deployments.get("FundMe"))
          beforeEach(async () => {
              deployer = (await getNamedAccounts()).deployer
              signer = await ethers.getSigner(deployer)
              fundMe = await ethers.getContractAt(
                  "FundMe",
                  (
                      await deployments.get("FundMe")
                  ).address,
                  signer
              )
          })

          it("allows people to fund and withdraw", async function () {
              const fundTxResponse = await fundMe.fund({ value: sendValue })
              await fundTxResponse.wait(1)
              const withdrawTxResponse = await fundMe.singleWithdraw()
              await withdrawTxResponse.wait(1)

              const endingFundMeBalance =
                  await fundMe.runner.provider.getBalance(fundMe.target)
              console.log(
                  endingFundMeBalance.toString() +
                      " should equal 0, running assert equal..."
              )
              assert.equal(endingFundMeBalance.toString(), "0")
          })
      })
