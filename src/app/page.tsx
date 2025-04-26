"use client";
import axios from "axios"
import { API_PATHS } from "@/utils/constants"
import { debounce } from "@tanstack/pacer";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";

export default function Home() {
  const [drawerList, setDrawerList] = useState(null);
  const [cardSelected, setCardSelected] = useState(null);
  const [amount, setAmount] = useState<null | string>(null);
  const [merchantSelected, setMerchantSelected] = useState(null);
  const [rewardData, setRewardData] = useState(null);
  const getCardList = debounce(async (text: string) => {
    if (text && text !== "") {
      const listOfCards = await axios.get(`${process.env.NEXT_PUBLIC_API_DOMAIN}${API_PATHS.GET_CARDS}?query=${text}`);
      setDrawerList(listOfCards.data);
      return;
    }
    setDrawerList(null);
  }, { wait: 500 });

  const getMerchantList = debounce(async (text: string) => {
    if (text && text !== "") {
      const listOfMerchants = await axios.get(`${process.env.NEXT_PUBLIC_API_DOMAIN}${API_PATHS.GET_MERCHANTS}?query=${text}`);
      setDrawerList(listOfMerchants.data);
      return;
    }
    setDrawerList(null);
  }, { wait: 500 });

  const handleSumitButton = async () => {
    setRewardData(null);
    if (cardSelected) {
      const reward = await axios.get(`${process.env.NEXT_PUBLIC_API_DOMAIN}${API_PATHS.GET_REWARDS}?card_id=${cardSelected?.id}&spend_mode=ONLINE&amount=${amount}&merchant_id=${merchantSelected?.id}`)
      setRewardData(reward.data);
    }
  }

  return (
    <div style={{width: "100%", backgroundColor: "white", alignItems:"center", display:"flex", justifyContent:"center"}}>
    <div style={{  height: "100%", margin: "1rem", maxWidth: "500px", width:"100%"}}>
      <Drawer>
        <DrawerTrigger asChild>
          <Button variant="outline" style={{ width: "100%", overflow: "hidden" }}>{cardSelected ? cardSelected.name : "Add Card"}</Button>
        </DrawerTrigger>
        <DrawerContent style={{ overflow: "hidden" }}>
          <div style={{ height: "100vh", overflow: "auto" }}>
            <DrawerHeader>
              <DrawerTitle>Add Card</DrawerTitle>
              <DrawerDescription>Search to select your card.</DrawerDescription>
            </DrawerHeader>
            <div style={{ padding: "0 1rem", overflow: "auto", flex: 1 }}>
              <Input placeholder="Search Card" onChange={(event) => { getCardList(event.target.value) }} />
              <div style={{ alignItems: drawerList && drawerList.length > 0 ? "flex-start" : "center" }}>
                {drawerList ?
                  drawerList["result_list"].map((card: { name: string, bank_name: string }) => {
                    return (
                      <DrawerClose key={card.id} onClick={() => { setCardSelected(card); setDrawerList(null) }}>
                        <div style={{ margin: "0.5rem 0", display: "flex", alignItems: "flex-start", flexDirection: "column", textAlign: "left" }}>
                          <p style={{ fontWeight: "500" }}>{card.name}</p>
                          <p style={{ fontSize: 14, color: "lightgray" }}>{card.bank_name}</p>
                        </div>
                      </DrawerClose>
                    );
                  })
                  : <div style={{ textAlign: "center" }}>No values to display</div>}
              </div>
            </div>
          </div>
        </DrawerContent>
      </Drawer>
      <Drawer>
        <DrawerTrigger asChild>
          <Button variant="outline" style={{ width: "100%", margin: "1rem 0", overflow: "hidden", textOverflow: "ellipsis" }}>{merchantSelected ? merchantSelected.description : "Add Merchant"}</Button>
        </DrawerTrigger>
        <DrawerContent style={{ overflow: "hidden" }}>
          <div style={{ height: "100vh", overflow: "auto" }}>
            <DrawerHeader>
              <DrawerTitle>Add Merchant</DrawerTitle>
              <DrawerDescription>Search to select your merchant.</DrawerDescription>
            </DrawerHeader>
            <div style={{ padding: "0 1rem", overflow: "auto", flex: 1 }}>
              <Input placeholder="Search Merchant" onChange={(event) => { getMerchantList(event.target.value) }} />
              <div style={{ alignItems: drawerList && drawerList["result_list"] && drawerList["result_list"].length > 0 ? "flex-start" : "center" }}>
                {drawerList ?
                  drawerList["result_list"].map((merchant: { description: string, bank_name: string }) => {
                    return (
                      <DrawerClose key={merchant.id
                      } onClick={() => { setMerchantSelected(merchant); setDrawerList(null) }}>
                        <div style={{ margin: "0.5rem 0", display: "flex", alignItems: "flex-start", flexDirection: "column", textAlign: "left" }}>
                          {<p style={{ fontWeight: "500" }}>{merchant.mcc_code} - {merchant.description}</p>}
                          <p style={{ fontSize: 14, color: "lightgray" }}>{merchant.businesses?.map((business: { name: string }) => business.name).join(", ")}</p>
                        </div>
                      </DrawerClose>
                    );
                  })
                  : <div style={{ textAlign: "center" }}>No values to display</div>}
              </div>
            </div>
          </div>
        </DrawerContent>
      </Drawer>
      <Input onChange={(event) => { setAmount(event.target.value) }} placeholder="Enter Amount" />
      <Button style={{ width: "100%", marginTop: "1rem", padding: "1.5rem" }} onClick={handleSumitButton}>Submit</Button>
      {rewardData ?
        <div style={{ marginTop: "1rem" }}>
          <p style={{ fontWeight: "700" }}>{rewardData.card.name}</p>
          <p>{rewardData.card.bank_name}</p>
          <p>Amount Spent : {rewardData.amount} {rewardData.card.reward_currency}</p>
          <p>Base Spend : {rewardData.data.special_merchant_offer_base_spend ?? rewardData.data.special_merchant_offer_base_spend ?? rewardData.data.effective_base_spend} </p>
          <p>Total Rewards : {rewardData.total_rewards}</p>
        </div> : null}
    </div>
    </div>
  )
}