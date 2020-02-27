library(dplyr)
newdata <- read.csv("/Users/haoyu/Downloads/geocoded.csv", 
                    stringsAsFactors = F)
df <- newdata %>% select("Unique_Key", "Created_Date",'Complaint_Type', 
                         'Status', 'Latitude', 'Longitude') %>%
  rename(Created_Time = Created_Date) %>%
  mutate(Status = ifelse(Status == "Closed", 
                         "Closed", "Not_Closed"))
harz_type <- data.frame(Complaint_Type = unique(df$Complaint_Type),
                        harz_l = c(1,3,4,5,3,2,3,2))
df <- merge(df, harz_type, by = "Complaint_Type")

for (i in 1:nrow(df)){
  df$Created_hr[i] = substring(df$Created_Time[i], 8,9)
  if (substring(df$Created_hr[i], 2)== ":"){
    df$Created_hr[i] = substring(df$Created_hr[i], 1,1)
  }
  df$Created_hr[i] <- as.numeric(df$Created_hr[i])
}



write.csv(df, "/Users/haoyu/Downloads/modified_toJson.csv", 
          row.names = FALSE)