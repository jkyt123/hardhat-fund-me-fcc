const { ConstructorFragment } = require("ethers")
const { run } = require("hardhat")

const verify = async (contractAddress, args) => {
    console.log("Verifying contract...")
    try {
        await run("verif:verify", {
            address: contractAddress,
            constructorArguments: args,
        })
    } catch (e) {
        if (e.message.toLowerCase().includes("already verififed")) {
            console.log("Already Verified!")
        } else {
            console.log(e)
        }
    }
}
module.exports = { verify }
