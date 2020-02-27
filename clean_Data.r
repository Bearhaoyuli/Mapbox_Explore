#is.not.null <- function(x) !is.null(x)
#write.csv(address_gc, "/Users/haoyu/Downloads/geocode.csv", row.names=FALSE)
library(ggmap)
complain <- read.csv("/Users/haoyu/Downloads/Odor_Complaints.csv", stringsAsFactors = F)
# tobe_gc = subset(complain, is.na(complain$Latitude))
# address_gc = subset(tobe_gc, !is.na(tobe_gc$Incident.Zip))
# write.csv(tobe_gc, "/Users/haoyu/Downloads/geocode_tworesult.csv", row.names=FALSE)
register_google(key = "AIzaSyCvL-zmIyV6PAlrCTSQCm9fnihLpqS5AR8")
for(i in 1:nrow(complain))
{
  if(is.na(complain$Latitude[i])){
    print(complain$Unique.Key[i])
    
    if (!is.na(complain$Incident.Zip[i])){
      string <- paste(complain$Cross.Street.1[i], complain$Street.Name[i], sep=", ")
      result <- geocode(string, output = "latlona", source = "google")
      string2 <- paste(complain$Cross.Street.2[i], complain$Street.Name[i], sep=", ")
      result2 <- geocode(string2, output = "latlona", source = "google")
      complain$Longitude[i] <- as.numeric((result2[1] + result[1])/2)
      complain$Latitude[i] <- as.numeric((result2[2] + result[2])/2)
      #complain$Location[i] <- as.character(result2[3])

    }else{
      string <-  paste("New York City", complain$Street.Name[i], sep=", ")
      result <- geocode(complain$Agency.Name[i], output = "latlona", source = "google")
      complain$Longitude[i] <- as.numeric(result[1])
      complain$Latitude[i] <- as.numeric(result[2])
      #complain$Location[i] <- as.character(result[3])
    }
  }
}
names(complain) <- gsub(x = names(complain), pattern = "\\.", replacement = "_")
write.csv(complain, "/Users/haoyu/Downloads/geocoded.csv", row.names=FALSE)