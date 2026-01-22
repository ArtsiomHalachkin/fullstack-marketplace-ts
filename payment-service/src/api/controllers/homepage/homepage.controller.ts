import express from "express";

export const homepageController = {
    homepage(req: express.Request, res: express.Response) {
        res.sendStatus(200);
    },
};
