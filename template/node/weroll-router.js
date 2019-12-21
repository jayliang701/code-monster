
const renderPAGE_NAME_UPPage = async (req, res, output, user) => {
    // const id = req.param("id");     // /abc/:id
    // const { id } = req.query;     // /abc?id=12345
    return { };
}

exports.getRouterMap = function() {
    return [
        { url: "/PAGE_NAME", view: "PAGE_NAME", handle: renderPAGE_NAME_UPPage, needLogin:false },
    ];
}