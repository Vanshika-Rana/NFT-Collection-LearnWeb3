export default function handler(req,res){
    const tokenId = req.query.tokenId;
    const image_url="../images/Nail.png";

    res.status(200).json({
        name: "Crypto Dev #" + tokenId,
        description: "Crypto Dev is a collection of developers in crypto",
        image_url: image_url + tokenId + ".png",
    });
}