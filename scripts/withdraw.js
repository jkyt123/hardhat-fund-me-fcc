const { getNamedAccounts, ethers, deployments } = require("hardhat")
async function main() {
    const { deployer } = await getNamedAccounts()
    signer = await ethers.getSigner(deployer)
    const fundMe = await ethers.getContractAt(
        "FundMe",
        (
            await deployments.get("FundMe")
        ).address,
        signer
    )
    console.log("Funding....")
    const transactionResponse = await fundMe.singleWithdraw()
    await transactionResponse.wait(1)
    console.log("Got it back!")
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
